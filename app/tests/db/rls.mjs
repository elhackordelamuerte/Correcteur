// Tests de la migration (RLS, crédits, rattachement) sur un vrai Postgres en WASM (PGlite).
// Les schémas auth et storage de Supabase sont remplacés par des substituts minimaux.
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../../supabase/migrations/20261026000000_init.sql", import.meta.url), "utf8");
const db = new PGlite({ extensions: { pgcrypto } });

// Substituts minimaux des schémas Supabase
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$
    select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
`);
await db.exec(migration);
await db.exec(`
  grant usage on schema public, auth, storage to anon, authenticated;
  grant all on all tables in schema public to authenticated;
  grant all on all sequences in schema public to authenticated;
  grant all on storage.objects to authenticated;
  grant execute on function auth.uid() to authenticated;
`);

let failures = 0;
const check = (name, cond, extra = "") => {
  console.log(`${cond ? "✓" : "✗"} ${name}${extra ? " — " + extra : ""}`);
  if (!cond) failures++;
};

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
const S = "00000000-0000-0000-0000-00000000000c";

await db.exec(`insert into auth.users values ('${A}', '{"role":"teacher","display_name":"Prof A"}'),
  ('${B}', '{"role":"teacher"}'), ('${S}', '{"role":"student","display_name":"Léa"}')`);

// Exécute une requête en tant qu'utilisateur authentifié (RLS active)
async function as(uid, sql, params = []) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec("reset role;");
  }
}
async function fails(uid, sql) {
  try { await as(uid, sql); return null; } catch (e) { return e.message; }
}

const profiles = await db.query("select id, role from public.profiles order by id");
check("profils créés par trigger", profiles.rows.length === 3);
const acc = await db.query("select * from public.teacher_accounts");
check("comptes enseignants (essai, 250 crédits)", acc.rows.length === 2 && acc.rows.every((r) => r.included_balance === 250 && r.plan === "trial"));

// Données de A
const cls = (await as(A, `insert into classes (teacher_id, name, join_code) values ('${A}', '4e B', 'ABCD23') returning id`)).rows[0].id;
const stu = (await as(A, `insert into students (class_id, teacher_id, first_name, last_name) values ('${cls}', '${A}', 'Léa', 'Martin') returning id, pseudo`)).rows[0];
check("pseudonyme généré", /^E-[0-9A-F]{6}$/.test(stu.pseudo), stu.pseudo);
const comp = (await as(A, `insert into competencies (teacher_id, label) values ('${A}', 'Calcul') returning id`)).rows[0].id;
const ev = (await as(A, `insert into evaluations (teacher_id, class_id, title) values ('${A}', '${cls}', 'DS 1') returning id`)).rows[0].id;
await as(A, `insert into criteria (evaluation_id, teacher_id, label, points, competency_id) values ('${ev}', '${A}', 'C1', 20, '${comp}')`);
const copy = (await as(A, `insert into copies (evaluation_id, student_id, teacher_id, status, score, final_result) values ('${ev}', '${stu.id}', '${A}', 'validated', 12, '{"criteria":[]}') returning id`)).rows[0].id;
await as(A, `insert into competency_observations (teacher_id, student_id, competency_id, source_type, source_id, ratio) values ('${A}', '${stu.id}', '${comp}', 'copy', '${copy}', 0.6)`);

// Cloisonnement entre enseignants
check("B ne voit pas les classes de A", (await as(B, "select * from classes")).rows.length === 0);
check("B ne voit pas les élèves de A", (await as(B, "select * from students")).rows.length === 0);
check("B ne voit pas les copies de A", (await as(B, "select * from copies")).rows.length === 0);
check("B ne peut pas modifier une copie de A", (await as(B, `update copies set score = 0 where id = '${copy}' returning id`)).rows.length === 0);
check("B ne peut pas ajouter un élève dans la classe de A", (await fails(B, `insert into students (class_id, teacher_id, first_name) values ('${cls}', '${B}', 'Intrus')`)) !== null);
const exB = await fails(B, `insert into exercises (teacher_id, class_id, title, statement, hints, difficulty) values ('${B}', '${cls}', 't', 's', '{a,b}', 1)`);
check("B ne peut pas créer d'exercice dans la classe de A", exB !== null);
check("B ne peut pas usurper teacher_id = A", (await fails(B, `insert into classes (teacher_id, name, join_code) values ('${A}', 'x', 'ZZZZ22')`)) !== null);

// Crédits
const left = (await as(A, `select consume_credits(2, 'test', '11111111-1111-1111-1111-111111111111') as v`)).rows[0].v;
check("débit de 2 crédits", left === 248, String(left));
await as(A, `select refund_credits(2, 'test', '11111111-1111-1111-1111-111111111111')`);
await as(A, `select refund_credits(2, 'test', '11111111-1111-1111-1111-111111111111')`);
const bal = (await as(A, "select included_balance + purchased_balance as b from teacher_accounts")).rows[0].b;
check("restitution unique (pas de double remboursement)", bal === 250, String(bal));
await as(B, `select refund_credits(1000, 'triche', null)`);
await as(B, `select refund_credits(1000, 'triche', '22222222-2222-2222-2222-222222222222')`);
const balB = (await as(B, "select included_balance + purchased_balance as b from teacher_accounts")).rows[0].b;
check("impossible de créer des crédits par restitution", balB === 250, String(balB));
check("solde insuffisant refusé", ((await fails(A, "select consume_credits(9999, 'x')")) ?? "").includes("insuffisants"));
check("montant négatif refusé", (await fails(A, "select consume_credits(-5, 'x')")) !== null);
check("solde non modifiable directement", (await as(A, "update teacher_accounts set purchased_balance = 99999 returning 1")).rows.length === 0);
check("refresh_period non appelable", (await fails(A, `select refresh_period('${A}')`)) !== null);
await db.exec(`update teacher_accounts set purchased_balance = 5 where teacher_id = '${A}'`);
await as(A, "select consume_credits(249, 'x')");
await as(A, "select consume_credits(3, 'x')");
const split = (await as(A, "select included_balance, purchased_balance from teacher_accounts")).rows[0];
check("inclus consommés avant achetés", split.included_balance === 0 && split.purchased_balance === 3, JSON.stringify(split));

// Fin d'essai → lecture seule
await db.exec(`update teacher_accounts set trial_ends_at = now() - interval '1 day' where teacher_id = '${B}'`);
check("essai expiré : actions IA bloquées", ((await fails(B, "select consume_credits(1, 'x')")) ?? "").includes("lecture seule"));

// Espace élève
check("élève : code inconnu refusé", ((await fails(S, "select join_class('ZZZZZZ', 'Léa', 'Martin')")) ?? "").includes("inconnu"));
const joined = (await as(S, "select join_class('abcd23', 'léa', 'MARTIN') as id")).rows[0].id;
check("élève : rattaché à la fiche existante (nom identique)", joined === stu.id);
check("enseignant ne peut pas rejoindre une classe", (await fails(A, "select join_class('ABCD23', 'x', 'y')")) !== null);
check("élève : copie validée mais non publiée invisible", (await as(S, "select * from copies")).rows.length === 0);
check("élève : évaluation invisible avant publication", (await as(S, "select * from evaluations")).rows.length === 0);
await as(A, `update copies set status = 'published' where id = '${copy}'`);
check("élève : copie publiée visible", (await as(S, "select * from copies")).rows.length === 1);
check("élève : évaluation et critères visibles après publication", (await as(S, "select * from evaluations")).rows.length === 1 && (await as(S, "select * from criteria")).rows.length === 1);
check("élève : ne peut pas modifier sa note", (await as(S, `update copies set score = 20 where id = '${copy}' returning 1`)).rows.length === 0);
check("élève : voit ses compétences", (await as(S, "select * from competencies")).rows.length === 1);
check("élève : ne voit pas le registre de crédits", (await as(S, "select * from credit_ledger")).rows.length === 0);

const ex = (await as(A, `insert into exercises (teacher_id, class_id, title, statement, hints, difficulty, competency_id) values ('${A}', '${cls}', 'Ex', 'Énoncé', '{i1,i2}', 2, '${comp}') returning id`)).rows[0].id;
check("exactement 2 indices imposés", (await fails(A, `insert into exercises (teacher_id, class_id, title, statement, hints, difficulty) values ('${A}', '${cls}', 'Ex', 'É', '{i1}', 2)`)) !== null);
const asg = (await as(A, `insert into exercise_assignments (exercise_id, student_id, teacher_id) values ('${ex}', '${stu.id}', '${A}') returning id`)).rows[0].id;
check("élève : voit l'exercice assigné", (await as(S, "select * from exercises")).rows.length === 1);
check("élève : pas de mise à jour directe", (await as(S, `update exercise_assignments set status = 'corrected', ratio = 1 where id = '${asg}' returning 1`)).rows.length === 0);
await as(S, `select submit_exercise('${asg}', 'Ma réponse')`);
check("élève : rendu via submit_exercise", (await as(A, `select status from exercise_assignments where id = '${asg}'`)).rows[0].status === "submitted");
check("élève : double rendu refusé", (await fails(S, `select submit_exercise('${asg}', 'encore')`)) !== null);

await as(A, `insert into appreciations (student_id, teacher_id, text) values ('${stu.id}', '${A}', 'Proposition')`);
check("élève : appréciation non validée invisible", (await as(S, "select * from appreciations")).rows.length === 0);
await as(A, `update appreciations set status = 'validated'`);
check("élève : appréciation validée visible", (await as(S, "select * from appreciations")).rows.length === 1);

// Stockage
check("stockage : dépôt dans son dossier", (await fails(A, `insert into storage.objects (bucket_id, name) values ('copies', '${A}/e/c/1.jpg')`)) === null);
check("stockage : dépôt refusé dans le dossier d'un autre", (await fails(B, `insert into storage.objects (bucket_id, name) values ('copies', '${A}/e/c/2.jpg')`)) !== null);
check("stockage : B ne lit pas les copies de A", (await as(B, "select * from storage.objects")).rows.length === 0);

// Effacement RGPD en cascade
await as(A, `delete from students where id = '${stu.id}'`);
const left2 = await db.query(`select (select count(*) from copies) c, (select count(*) from competency_observations) o, (select count(*) from exercise_assignments) a, (select count(*) from appreciations) p`);
check("effacement élève : cascade complète", Object.values(left2.rows[0]).every((v) => Number(v) === 0), JSON.stringify(left2.rows[0]));

console.log(failures === 0 ? "\nTOUS LES TESTS SQL PASSENT" : `\n${failures} ÉCHEC(S)`);
process.exit(failures ? 1 : 0);
