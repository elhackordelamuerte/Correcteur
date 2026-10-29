import Link from "next/link";
import { notFound } from "next/navigation";
import { publishEvaluation } from "@/app/actions/copies";
import { createVariant, freezeRubric, saveEvaluation, suggestRubric, unfreezeRubric, updateVariant } from "@/app/actions/evaluations";
import { ActionForm } from "@/components/action-form";
import { AnalyzePanel } from "@/components/analyze-panel";
import { EvaluationUploader } from "@/components/evaluation-uploader";
import { RubricEditor } from "@/components/rubric-editor";
import { ScanQr } from "@/components/scan-qr";
import { CopyStatus } from "@/components/status";
import { Badge, Card, Cost, Empty, inputClass, PageTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { SITE_URL } from "@/lib/env";
import { formatPoints } from "@/lib/format";
import { CREDIT_COSTS, DYS_NEEDS, INTENSITY_LABELS } from "@/lib/rules";

export const maxDuration = 60;

type VariantContent = { statement: string; criteria: { label: string; points: number }[]; transformations: string[] };

export default async function EvaluationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole("teacher");
  const { data: evaluation } = await supabase.from("evaluations").select("*, classes(id,name)").eq("id", id).single();
  if (!evaluation) notFound();
  const [{ data: criteria }, { data: students }, { data: copies }, { data: variants }] = await Promise.all([
    supabase.from("criteria").select("*, competencies(label)").eq("evaluation_id", id).order("position"),
    supabase.from("students").select("id,first_name,last_name").eq("class_id", evaluation.class_id).order("last_name"),
    supabase.from("copies").select("id,student_id,status,score,error,file_paths,analysis_started_at").eq("evaluation_id", id),
    supabase.from("variants").select("*").eq("evaluation_id", id).order("created_at", { ascending: false }),
  ]);
  const ready = evaluation.status === "ready";
  const copyByStudent = new Map((copies ?? []).map((c) => [c.student_id, c]));
  const stuckBefore = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const toAnalyze = (copies ?? [])
    .filter((c) => c.file_paths.length > 0 && (["uploaded", "error"].includes(c.status) || (c.status === "analyzing" && (c.analysis_started_at ?? "") < stuckBefore)))
    .map((c) => c.id);
  const validatedCount = (copies ?? []).filter((c) => c.status === "validated").length;
  const klass = evaluation.classes as unknown as { id: string; name: string };

  return (
    <>
      <PageTitle
        title={evaluation.title}
        subtitle={<>Sur {formatPoints(evaluation.total_points)} points · {ready ? <Badge tone="green">Barème figé</Badge> : <Badge>Brouillon</Badge>}</>}
        back={{ href: `/app/classes/${klass.id}`, label: klass.name }}
      />
      <div className="space-y-6">
        {ready ? (
          <Card title="Énoncé et barème" actions={<ActionForm action={unfreezeRubric.bind(null, id)} submitLabel="Dégeler" variant="secondary" />}>
            <p className="prose-copia mb-4 text-sm">{evaluation.statement || "(Énoncé non saisi)"}</p>
            <ul className="divide-y divide-slate-100 text-sm">
              {(criteria ?? []).map((c) => (
                <li key={c.id} className="flex justify-between gap-4 py-2">
                  <span>
                    <strong>{c.label}</strong> {c.competencies && <Badge tone="blue">{(c.competencies as { label: string }).label}</Badge>}
                    {c.expected && <span className="block text-slate-500">{c.expected}</span>}
                  </span>
                  <span className="shrink-0 font-medium">{formatPoints(c.points)} pt</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card
            title="Énoncé et barème"
            actions={
              <div className="flex flex-wrap gap-2">
                <ActionForm action={suggestRubric.bind(null, id)} submitLabel={<>Proposer un barème <Cost credits={CREDIT_COSTS.rubric} /></>} variant="secondary" pendingLabel="Génération…" />
                <ActionForm action={freezeRubric.bind(null, id)} submitLabel="Figer le barème" />
              </div>
            }
          >
            <p className="mb-4 text-sm text-slate-600">Le barème est fixé avant toute correction : l&apos;IA corrige selon vos critères, pas selon les siens.</p>
            <RubricEditor
              key={(criteria ?? []).map((c) => c.id).join()}
              action={saveEvaluation.bind(null, id)}
              title={evaluation.title}
              statement={evaluation.statement}
              total={Number(evaluation.total_points)}
              initial={(criteria ?? []).map((c) => ({
                label: c.label,
                expected: c.expected,
                points: String(c.points),
                competency: (c.competencies as { label: string } | null)?.label ?? "",
              }))}
            />
          </Card>
        )}

        <Card title="Copies">
          {!ready && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Vous pouvez déposer les copies dès maintenant ; l&apos;analyse sera possible une fois le barème figé.</p>}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <ScanQr evaluationId={id} siteUrl={SITE_URL} />
              <EvaluationUploader
                evaluationId={id}
                students={(students ?? []).map((s) => ({ id: s.id, label: `${s.first_name} ${s.last_name}`, done: (copyByStudent.get(s.id)?.file_paths.length ?? 0) > 0 }))}
              />
            </div>
            <div className="space-y-4">
              {ready && <AnalyzePanel copyIds={toAnalyze} />}
              {validatedCount > 0 && (
                <ActionForm
                  action={publishEvaluation.bind(null, id)}
                  submitLabel={`Publier ${validatedCount} copie(s) validée(s)`}
                  confirm="Les élèves verront leurs résultats. Publier ?"
                />
              )}
            </div>
          </div>
          <table className="mt-6 min-w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th className="py-2">Élève</th><th>Statut</th><th>Note</th><th /></tr></thead>
            <tbody>
              {(students ?? []).map((s) => {
                const copy = copyByStudent.get(s.id);
                return (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="py-2">{s.first_name} {s.last_name}</td>
                    <td>{copy ? <CopyStatus status={copy.status} /> : <Badge>Pas de copie</Badge>}</td>
                    <td>{copy?.score != null ? `${formatPoints(copy.score)} / ${formatPoints(evaluation.total_points)}` : "–"}</td>
                    <td className="text-right">
                      {copy && copy.file_paths.length > 0 && (
                        <Link className="text-brand-600 hover:underline" href={`/app/copies/${copy.id}`}>
                          {copy.status === "proposed" ? "Valider" : "Ouvrir"}
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card title="Adaptation DYS / PAP">
          <ActionForm action={createVariant.bind(null, id)} submitLabel={<>Générer une variante <Cost credits={CREDIT_COSTS.variant} /></>} pendingLabel="Génération…">
            <p className="text-sm text-slate-600">Ce sont des leviers d&apos;adaptation, pas des diagnostics. Le niveau d&apos;exigence et le total de points sont conservés ; rien sur la feuille n&apos;indique qu&apos;elle est adaptée.</p>
            <fieldset className="flex flex-wrap gap-3 text-sm">
              {DYS_NEEDS.map((n) => <label key={n} className="flex items-center gap-1"><input type="checkbox" name="needs" value={n} /> {n}</label>)}
            </fieldset>
            <fieldset className="space-y-1 text-sm">
              {[1, 2, 3].map((i) => <label key={i} className="flex items-center gap-2"><input type="radio" name="intensity" value={i} defaultChecked={i === 2} /> Intensité {i} — {INTENSITY_LABELS[i]}</label>)}
            </fieldset>
          </ActionForm>
          <div className="mt-6 space-y-4">
            {(variants ?? []).length === 0 && <Empty>Aucune variante.</Empty>}
            {(variants ?? []).map((v) => {
              const content = v.content as VariantContent;
              return (
                <div key={v.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                    {v.status === "validated" ? <Badge tone="green">Validée</Badge> : <Badge tone="amber">Proposition</Badge>}
                    <span className="text-slate-600">{(v.needs as string[]).join(", ")} · intensité {v.intensity}</span>
                    {v.status === "validated" && <Link className="ml-auto text-brand-600 hover:underline" href={`/app/variantes/${v.id}`}>Imprimer</Link>}
                  </div>
                  <details className="mb-2 text-sm">
                    <summary className="cursor-pointer text-slate-600">Transformations appliquées ({content.transformations.length})</summary>
                    <ul className="ml-5 list-disc">{content.transformations.map((t) => <li key={t}>{t}</li>)}</ul>
                  </details>
                  <ActionForm action={updateVariant.bind(null, v.id)} submitLabel="Enregistrer et valider" className="space-y-2">
                    <input type="hidden" name="intent" value="validate" />
                    <textarea className={inputClass} name="statement" defaultValue={content.statement} rows={6} />
                  </ActionForm>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
