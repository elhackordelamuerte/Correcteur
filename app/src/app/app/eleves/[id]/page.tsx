import Link from "next/link";
import { notFound } from "next/navigation";
import { eraseStudent, saveAppreciation, suggestAppreciation } from "@/app/actions/students";
import { ActionForm } from "@/components/action-form";
import { CompetencyBadge, CopyStatus } from "@/components/status";
import { Badge, Card, Cost, Empty, inputClass, PageTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { loadCompetencyMap } from "@/lib/competencies";
import { getAccount, hasExpertFeatures } from "@/lib/credits";
import { formatDate, formatPoints } from "@/lib/format";
import { CREDIT_COSTS, statusFromRatio, STATUS_LABELS } from "@/lib/rules";

export const maxDuration = 60;

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireRole("teacher");
  const { data: student } = await supabase.from("students").select("*, classes(id,name)").eq("id", id).single();
  if (!student) notFound();
  const [map, { data: copies }, { data: appreciation }, { data: history }, account] = await Promise.all([
    loadCompetencyMap(supabase, [id]),
    supabase.from("copies").select("id,status,score,evaluations(title,total_points)").eq("student_id", id).order("created_at", { ascending: false }),
    supabase.from("appreciations").select("*").eq("student_id", id).maybeSingle(),
    supabase.from("competency_observations").select("ratio,created_at,source_type,competencies(label)").eq("student_id", id).order("created_at", { ascending: false }).limit(30),
    getAccount(supabase, user.id),
  ]);
  const klass = student.classes as { id: string; name: string };

  return (
    <>
      <PageTitle title={`${student.first_name} ${student.last_name}`} subtitle={<>Identifiant transmis à l&apos;IA : <span className="font-mono">{student.pseudo}</span></>} back={{ href: `/app/classes/${klass.id}`, label: klass.name }} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Compétences">
          {map.competencies.length === 0 ? (
            <Empty>Aucune observation validée.</Empty>
          ) : (
            <ul className="space-y-2 text-sm">
              {map.competencies.map((c) => (
                <li key={c.id} className="flex justify-between gap-2"><span>{c.label}</span><CompetencyBadge status={map.status[id][c.id]} /></li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Appréciation" actions={<ActionForm action={suggestAppreciation.bind(null, id)} submitLabel={<>Proposer <Cost credits={CREDIT_COSTS.appreciation} /></>} variant="secondary" pendingLabel="Rédaction…" />}>
          {appreciation && <p className="mb-2">{appreciation.status === "validated" ? <Badge tone="green">Validée — visible par l&apos;élève</Badge> : <Badge tone="amber">Proposition à relire</Badge>}</p>}
          <ActionForm action={saveAppreciation.bind(null, id)} submitLabel="Valider l'appréciation" key={appreciation?.updated_at}>
            <input type="hidden" name="intent" value="validate" />
            <textarea className={inputClass} name="text" rows={5} defaultValue={appreciation?.text ?? ""} placeholder="Rédigez ou générez une proposition, puis validez." />
          </ActionForm>
        </Card>

        <Card title="Copies">
          {copies?.length ? (
            <ul className="divide-y divide-line text-sm">
              {copies.map((c) => {
                const e = c.evaluations as unknown as { title: string; total_points: number };
                return (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <Link className="text-pen hover:underline" href={`/app/copies/${c.id}`}>{e.title}</Link>
                    <span className="flex items-center gap-2"><CopyStatus status={c.status} />{c.score != null && `${formatPoints(c.score)} / ${formatPoints(e.total_points)}`}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>Aucune copie.</Empty>
          )}
        </Card>

        <Card title="Suivi dans le temps" actions={!hasExpertFeatures(account?.plan) && <Badge tone="blue">Expert</Badge>}>
          {!hasExpertFeatures(account?.plan) ? (
            <p className="text-sm text-ink-soft">L&apos;historique des observations est inclus dans le forfait Expert.</p>
          ) : history?.length ? (
            <ul className="space-y-1 text-sm">
              {history.map((h, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span>{formatDate(h.created_at)} · {(h.competencies as unknown as { label: string })?.label} <span className="text-ink-mute">({h.source_type === "copy" ? "copie" : "exercice"})</span></span>
                  <span>{STATUS_LABELS[statusFromRatio(Number(h.ratio))]} ({Math.round(Number(h.ratio) * 100)} %)</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Pas encore d&apos;historique.</Empty>
          )}
        </Card>

        <Card title="Confidentialité & RGPD" className="lg:col-span-2">
          <div className="flex flex-wrap items-start gap-4">
            <a className="rounded-lg border border-line-strong px-4 py-2 text-sm hover:bg-paper" href={`/api/eleves/${id}/export`}>Exporter toutes ses données (JSON)</a>
            <ActionForm action={eraseStudent.bind(null, id)} submitLabel="Effacer définitivement l'élève" variant="danger" confirm="Copies, analyses, compétences et profil seront supprimés définitivement. Continuer ?" />
          </div>
        </Card>
      </div>
    </>
  );
}
