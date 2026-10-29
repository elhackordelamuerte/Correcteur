// Vérification de bout en bout sur le projet Supabase réel (RLS active, API publique).
// Crée des comptes jetables @copia.test, exécute les contrôles, puis supprime tout.
// Usage : npm run check:supabase   (lit .env.local)
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !PUBLIC_KEY || !SECRET_KEY) {
  console.error("Variables Supabase manquantes dans .env.local");
  process.exit(1);
}

const admin = createClient(URL, SECRET_KEY, { auth: { persistSession: false } });
const run = Date.now().toString(36);
const PASSWORD = `Test-${run}-pass!`;
const createdUsers = [];
let failures = 0;

const check = (name, cond, extra = "") => {
  console.log(`${cond ? "✓" : "✗"} ${name}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures++;
};

async function makeUser(label, role) {
  const email = `${label}-${run}@copia.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role, display_name: label },
  });
  if (error) throw new Error(`Création ${label} : ${error.message}`);
  createdUsers.push(data.user.id);
  const client = createClient(URL, PUBLIC_KEY, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signInError) throw new Error(`Connexion ${label} : ${signInError.message}`);
  return { id: data.user.id, client };
}

async function main() {
  const A = await makeUser("prof-a", "teacher");
  const B = await makeUser("prof-b", "teacher");
  const S = await makeUser("eleve", "student");

  const { data: profile } = await A.client.from("profiles").select("role").single();
  check("trigger : profil enseignant créé", profile?.role === "teacher");
  const { data: account } = await A.client.from("teacher_accounts").select("plan, included_balance").single();
  check("compte d'essai à 250 crédits", account?.plan === "trial" && account?.included_balance === 250, JSON.stringify(account));

  const code = `T${run.slice(-5).toUpperCase().replace(/[^A-Z2-9]/g, "Z")}`.slice(0, 6).padEnd(6, "Z");
  const { data: klass, error: classError } = await A.client.from("classes").insert({ teacher_id: A.id, name: "Test", join_code: code }).select("id").single();
  check("A crée une classe", !classError, classError?.message);
  const { data: student } = await A.client.from("students").insert({ class_id: klass.id, teacher_id: A.id, first_name: "Léa", last_name: "Test" }).select("id").single();
  const { data: evaluation } = await A.client.from("evaluations").insert({ teacher_id: A.id, class_id: klass.id, title: "DS test" }).select("id").single();

  const { data: seenByB } = await B.client.from("classes").select("id");
  check("B ne voit pas la classe de A", seenByB?.length === 0);
  const { error: intrusion } = await B.client.from("students").insert({ class_id: klass.id, teacher_id: B.id, first_name: "Intrus" });
  check("B ne peut pas ajouter d'élève chez A", Boolean(intrusion));

  const ref = crypto.randomUUID();
  const { data: left } = await A.client.rpc("consume_credits", { p_amount: 2, p_reason: "test", p_ref: ref });
  check("débit atomique", left === 248, String(left));
  await A.client.rpc("refund_credits", { p_amount: 2, p_reason: "test", p_ref: ref });
  await A.client.rpc("refund_credits", { p_amount: 2, p_reason: "test", p_ref: ref });
  const { data: after } = await A.client.from("teacher_accounts").select("included_balance, purchased_balance").single();
  check("restitution unique", after.included_balance + after.purchased_balance === 250, JSON.stringify(after));
  await B.client.rpc("refund_credits", { p_amount: 500, p_reason: "triche", p_ref: crypto.randomUUID() });
  const { data: bAccount } = await B.client.from("teacher_accounts").select("included_balance, purchased_balance").single();
  check("impossible de créer des crédits", bAccount.included_balance + bAccount.purchased_balance === 250);
  const { data: tampered } = await A.client.from("teacher_accounts").update({ purchased_balance: 99999 }).eq("teacher_id", A.id).select();
  check("solde non modifiable par le client", (tampered ?? []).length === 0);

  const { data: joined, error: joinError } = await S.client.rpc("join_class", { p_code: code.toLowerCase(), p_first_name: "léa", p_last_name: "TEST" });
  check("élève rattaché par code à sa fiche", joined === student.id, joinError?.message);

  await A.client.from("copies").insert({ evaluation_id: evaluation.id, student_id: student.id, teacher_id: A.id, status: "validated", score: 14, final_result: { criteria: [], general_comment: "" } });
  const { data: hidden } = await S.client.from("copies").select("id");
  check("copie validée non publiée invisible pour l'élève", hidden?.length === 0);
  await A.client.from("copies").update({ status: "published" }).eq("evaluation_id", evaluation.id);
  const { data: visible } = await S.client.from("copies").select("id, score");
  check("copie publiée visible pour l'élève", visible?.length === 1);
  const { data: cheat } = await S.client.from("copies").update({ score: 20 }).eq("evaluation_id", evaluation.id).select();
  check("l'élève ne peut pas modifier sa note", (cheat ?? []).length === 0);

  const path = `${A.id}/${evaluation.id}/check/page.jpg`;
  const { data: ticket, error: ticketError } = await A.client.storage.from("copies").createSignedUploadUrl(path);
  check("stockage : URL de dépôt signée", !ticketError, ticketError?.message);
  if (ticket) {
    const { error: upError } = await A.client.storage.from("copies").uploadToSignedUrl(path, ticket.token, new Blob([new Uint8Array([255, 216, 255])], { type: "image/jpeg" }), { contentType: "image/jpeg" });
    check("stockage : dépôt du fichier", !upError, upError?.message);
  }
  const { error: foreignUpload } = await B.client.storage.from("copies").createSignedUploadUrl(`${A.id}/x/y/z.jpg`);
  check("stockage : B ne peut pas déposer chez A", Boolean(foreignUpload));
  const { data: foreignRead } = await B.client.storage.from("copies").download(path);
  check("stockage : B ne peut pas lire chez A", !foreignRead);
  await admin.storage.from("copies").remove([path]);
}

try {
  await main();
} catch (error) {
  failures++;
  console.error("✗ Erreur :", error.message);
} finally {
  // Nettoyage : la suppression des comptes efface tout en cascade
  for (const id of createdUsers) await admin.auth.admin.deleteUser(id);
  console.log(`\nComptes de test supprimés (${createdUsers.length}).`);
  console.log(failures === 0 ? "VÉRIFICATION SUPABASE OK" : `${failures} ÉCHEC(S)`);
  process.exit(failures ? 1 : 0);
}
