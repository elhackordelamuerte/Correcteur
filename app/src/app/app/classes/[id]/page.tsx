import Link from "next/link";
import { notFound } from "next/navigation";
import { regenerateJoinCode } from "@/app/actions/classes";
import { createEvaluation } from "@/app/actions/evaluations";
import { ActionForm } from "@/components/action-form";
import { CompetencyBadge } from "@/components/status";
import { StudentRoster } from "@/components/student-roster";
import { Badge, Cost, Empty, Field, inputClass, LinkButton, PageTitle, Stamp, Stat } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { loadCompetencyMap } from "@/lib/competencies";
import { getAccount, hasExpertFeatures } from "@/lib/credits";
import { getRequestOrigin } from "@/lib/request-origin";
import { formatDate } from "@/lib/format";
import { CREDIT_COSTS, STATUS_LABELS, type CompetencyStatus } from "@/lib/rules";

export const maxDuration = 60;

const LEGEND: CompetencyStatus[] = ["besoin", "fragile", "satisfaisante"];

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireRole("teacher");
  const { data: klass } = await supabase.from("classes").select("*").eq("id", id).single();
  if (!klass) notFound();
  const [{ data: students }, { data: evaluations }, account] = await Promise.all([
    supabase.from("students").select("id,first_name,last_name,user_id").eq("class_id", id).order("last_name").order("first_name"),
    supabase.from("evaluations").select("id,title,status,created_at, copies(status)").eq("class_id", id).order("created_at", { ascending: false }),
    getAccount(supabase, user.id),
  ]);
  const roster = (students ?? []).map((s) => ({ id: s.id, first_name: s.first_name, last_name: s.last_name, linked: Boolean(s.user_id) }));
  const expert = hasExpertFeatures(account?.plan);
  const map = expert ? await loadCompetencyMap(supabase, roster.map((s) => s.id)) : null;

  return (
    <>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-6">
        <PageTitle
          back={{ href: "/app", label: "Tableau de bord" }}
          eyebrow={[klass.level, klass.subject].filter(Boolean).join(" · ") || "Classe"}
          title={klass.name}
        />
        <div className="mb-10 flex flex-col items-end gap-2">
          <Stamp>{klass.join_code}</Stamp>
          <ActionForm action={regenerateJoinCode.bind(null, id)} submitLabel="Nouveau code" variant="ghost" confirm="L'ancien code ne fonctionnera plus. Continuer ?" className="text-xs" />
        </div>
      </div>

      <div className="mb-14 grid grid-cols-3 gap-6 border-y border-line py-6">
        <Stat value={roster.length} label="élèves" />
        <Stat value={(evaluations ?? []).length} label="évaluations" />
        <Stat value={roster.filter((s) => s.linked).length} label="comptes élèves" />
      </div>

      <section className="mb-16">
        <StudentRoster classId={id} students={roster} joinCode={klass.join_code} siteUrl={await getRequestOrigin()} />
      </section>

      <section className="mb-16">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl font-medium tracking-tight">Évaluations</h2>
          <LinkButton href={`/app/classes/${id}/exercices`} variant="ghost" className="ml-auto">Exercices de remédiation →</LinkButton>
        </div>

        {(evaluations ?? []).length > 0 && (
          <ul className="mb-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-sheet">
            {(evaluations ?? []).map((e) => {
              const copies = (e.copies as { status: string }[]) ?? [];
              const pending = copies.filter((c) => c.status === "proposed").length;
              const published = copies.filter((c) => c.status === "published").length;
              return (
                <li key={e.id}>
                  <Link href={`/app/evaluations/${e.id}`} className="flex flex-wrap items-center gap-3 px-5 py-4 transition-colors hover:bg-paper/60">
                    <span className="font-medium">{e.title}</span>
                    {e.status === "draft" && <Badge>Brouillon</Badge>}
                    {pending > 0 && <Badge tone="amber">{pending} à valider</Badge>}
                    <span className="ml-auto text-sm text-ink-mute">
                      {copies.length > 0 && `${published}/${copies.length} publiées · `}
                      {formatDate(e.created_at)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <details className="group rounded-2xl border border-dashed border-line-strong open:border-solid open:border-line open:bg-sheet" open={(evaluations ?? []).length === 0}>
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-medium text-ink-soft hover:text-ink">
            <span className="text-pen transition-transform group-open:rotate-45">+</span> Nouvelle évaluation
          </summary>
          <div className="grid gap-8 border-t border-line p-5 md:grid-cols-2">
            <ActionForm action={createEvaluation} submitLabel={<>Générer énoncé + barème <Cost credits={CREDIT_COSTS.evaluation} /></>} pendingLabel="Génération…">
              <p className="font-display text-lg">Avec l&apos;IA</p>
              <input type="hidden" name="class_id" value={id} />
              <input type="hidden" name="mode" value="ai" />
              <Field label="Sujet et notions évaluées">
                <textarea className={inputClass} name="topic" rows={3} placeholder="Théorème de Pythagore : calcul de longueurs et réciproque" required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Total"><input className={inputClass} name="total_points" type="number" defaultValue={20} min={1} /></Field>
                <Field label="Durée (min)"><input className={inputClass} name="duration" type="number" defaultValue={55} min={10} /></Field>
              </div>
            </ActionForm>
            <ActionForm action={createEvaluation} submitLabel={<>Créer <Cost credits={0} /></>} variant="secondary">
              <p className="font-display text-lg">À partir de mon sujet</p>
              <input type="hidden" name="class_id" value={id} />
              <input type="hidden" name="mode" value="manual" />
              <Field label="Titre"><input className={inputClass} name="title" required /></Field>
              <Field label="Énoncé" hint="Le barème pourra être proposé gratuitement par l'IA."><textarea className={inputClass} name="statement" rows={3} /></Field>
              <Field label="Total"><input className={inputClass} name="total_points" type="number" defaultValue={20} min={1} /></Field>
            </ActionForm>
          </div>
        </details>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <h2 className="font-display text-xl font-medium tracking-tight">Carte des compétences</h2>
          {map && map.competencies.length > 0 && (
            <div className="ml-auto flex gap-4">
              {LEGEND.map((s) => <CompetencyBadge key={s} status={s} />)}
            </div>
          )}
          {!expert && <Badge tone="blue">Expert</Badge>}
        </div>
        {!map ? (
          <Empty>La carte élèves × compétences est incluse dans le forfait Expert.</Empty>
        ) : map.competencies.length === 0 ? (
          <Empty>Les compétences apparaîtront dès la première copie validée.</Empty>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-sheet">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="sticky left-0 bg-sheet px-4 py-3 text-left font-normal text-ink-mute">Élève</th>
                  {map.competencies.map((c) => (
                    <th key={c.id} className="max-w-28 px-3 py-3 text-left text-xs font-normal leading-tight text-ink-soft">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roster.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                    <td className="sticky left-0 bg-sheet px-4 py-2.5">
                      <Link className="hover:text-pen" href={`/app/eleves/${s.id}`}>{s.first_name} {s.last_name}</Link>
                    </td>
                    {map.competencies.map((c) => {
                      const status = map.status[s.id]?.[c.id] ?? null;
                      return (
                        <td key={c.id} className="px-3 py-2.5" aria-label={status ? STATUS_LABELS[status] : "Non observée"}>
                          <CompetencyBadge status={status} compact />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
