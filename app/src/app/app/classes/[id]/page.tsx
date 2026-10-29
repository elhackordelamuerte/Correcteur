import Link from "next/link";
import { notFound } from "next/navigation";
import { addStudents, regenerateJoinCode } from "@/app/actions/classes";
import { createEvaluation } from "@/app/actions/evaluations";
import { ActionForm } from "@/components/action-form";
import { CompetencyBadge } from "@/components/status";
import { Badge, Card, Cost, Empty, Field, inputClass, LinkButton, PageTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { loadCompetencyMap } from "@/lib/competencies";
import { getAccount, hasExpertFeatures } from "@/lib/credits";
import { formatDate } from "@/lib/format";
import { CREDIT_COSTS } from "@/lib/rules";

export const maxDuration = 60;

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireRole("teacher");
  const { data: klass } = await supabase.from("classes").select("*").eq("id", id).single();
  if (!klass) notFound();
  const [{ data: students }, { data: evaluations }, account] = await Promise.all([
    supabase.from("students").select("id,first_name,last_name,user_id").eq("class_id", id).order("last_name"),
    supabase.from("evaluations").select("id,title,status,created_at,total_points").eq("class_id", id).order("created_at", { ascending: false }),
    getAccount(supabase, user.id),
  ]);
  const expert = hasExpertFeatures(account?.plan);
  const map = expert ? await loadCompetencyMap(supabase, (students ?? []).map((s) => s.id)) : null;

  return (
    <>
      <PageTitle
        title={klass.name}
        subtitle={[klass.level, klass.subject].filter(Boolean).join(" · ")}
        back={{ href: "/app", label: "Mes classes" }}
      />
      <div className="mb-6 flex flex-wrap gap-3">
        <LinkButton href={`/app/classes/${id}/exercices`} variant="secondary">Exercices de remédiation</LinkButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Évaluations">
            {evaluations?.length ? (
              <ul className="divide-y divide-slate-100">
                {evaluations.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                    <Link className="text-brand-600 hover:underline" href={`/app/evaluations/${e.id}`}>{e.title}</Link>
                    <span className="flex items-center gap-2 text-slate-500">
                      {e.status === "ready" ? <Badge tone="green">Barème figé</Badge> : <Badge>Brouillon</Badge>}
                      {formatDate(e.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Aucune évaluation pour cette classe.</Empty>
            )}
          </Card>

          <Card title="Nouvelle évaluation">
            <div className="grid gap-6 md:grid-cols-2">
              <ActionForm action={createEvaluation} submitLabel={<>Générer énoncé + barème <Cost credits={CREDIT_COSTS.evaluation} /></>} pendingLabel="Génération…">
                <input type="hidden" name="class_id" value={id} />
                <input type="hidden" name="mode" value="ai" />
                <Field label="Sujet et notions évaluées"><textarea className={inputClass} name="topic" rows={3} placeholder="Théorème de Pythagore : calcul de longueurs et réciproque" required /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Total (points)"><input className={inputClass} name="total_points" type="number" defaultValue={20} min={1} /></Field>
                  <Field label="Durée (min)"><input className={inputClass} name="duration" type="number" defaultValue={55} min={10} /></Field>
                </div>
              </ActionForm>
              <ActionForm action={createEvaluation} submitLabel={<>Créer à partir de mon sujet <Cost credits={0} /></>} variant="secondary">
                <input type="hidden" name="class_id" value={id} />
                <input type="hidden" name="mode" value="manual" />
                <Field label="Titre"><input className={inputClass} name="title" required /></Field>
                <Field label="Énoncé" hint="Le barème peut ensuite être proposé gratuitement par l'IA."><textarea className={inputClass} name="statement" rows={3} /></Field>
                <Field label="Total (points)"><input className={inputClass} name="total_points" type="number" defaultValue={20} min={1} /></Field>
              </ActionForm>
            </div>
          </Card>

          <Card title="Carte des compétences" actions={!expert && <Badge tone="blue">Expert</Badge>}>
            {!map ? (
              <p className="text-sm text-slate-600">La carte élèves × compétences est incluse dans le forfait Expert.</p>
            ) : map.competencies.length === 0 ? (
              <Empty>Les compétences apparaissent dès la première copie validée.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-white p-2 text-left">Élève</th>
                      {map.competencies.map((c) => <th key={c.id} className="p-2 text-left font-medium">{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(students ?? []).map((s) => (
                      <tr key={s.id} className="border-t border-slate-100">
                        <td className="sticky left-0 bg-white p-2"><Link className="hover:underline" href={`/app/eleves/${s.id}`}>{s.first_name} {s.last_name}</Link></td>
                        {map.competencies.map((c) => <td key={c.id} className="p-2"><CompetencyBadge status={map.status[s.id]?.[c.id] ?? null} /></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Code classe">
            <p className="font-mono text-3xl tracking-widest text-brand-700">{klass.join_code}</p>
            <p className="mb-3 mt-1 text-sm text-slate-600">Les élèves créent un compte élève et saisissent ce code pour rejoindre la classe.</p>
            <ActionForm action={regenerateJoinCode.bind(null, id)} submitLabel="Régénérer le code" variant="secondary" confirm="L'ancien code ne fonctionnera plus. Continuer ?" />
          </Card>
          <Card title={`Élèves (${students?.length ?? 0})`}>
            <ul className="mb-4 max-h-80 space-y-1 overflow-y-auto text-sm">
              {(students ?? []).map((s) => (
                <li key={s.id} className="flex justify-between">
                  <Link className="hover:underline" href={`/app/eleves/${s.id}`}>{s.first_name} {s.last_name}</Link>
                  {s.user_id && <Badge tone="green">compte lié</Badge>}
                </li>
              ))}
            </ul>
            <ActionForm action={addStudents.bind(null, id)} submitLabel="Ajouter" variant="secondary">
              <Field label="Ajouter des élèves" hint="Un élève par ligne : Prénom Nom"><textarea className={inputClass} name="names" rows={4} /></Field>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
