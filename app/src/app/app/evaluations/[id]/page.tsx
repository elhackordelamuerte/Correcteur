import Link from "next/link";
import { notFound } from "next/navigation";
import { publishEvaluation } from "@/app/actions/copies";
import { createVariant, freezeRubric, saveEvaluation, suggestRubric, unfreezeRubric, updateVariant } from "@/app/actions/evaluations";
import { ActionForm } from "@/components/action-form";
import { AnalyzePanel } from "@/components/analyze-panel";
import { EvaluationUploader } from "@/components/evaluation-uploader";
import { RichText } from "@/components/rich-text";
import { RubricEditor } from "@/components/rubric-editor";
import { ScanQr } from "@/components/scan-qr";
import { CopyStatus } from "@/components/status";
import { Tabs } from "@/components/tabs";
import { Badge, Card, Cost, Empty, inputClass, PageTitle, PenScore } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getRequestOrigin } from "@/lib/request-origin";
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
      {/* Le sujet est la zone principale ; copies et adaptations dans une colonne d'outils qui reste visible */}
      <div data-wide className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_25rem] xl:gap-8">
        <div className="space-y-6">
          {ready ? (
            <>
            {/* Le sujet présenté comme une feuille : marge rouge, texte à taille de lecture */}
            <article className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_40px_-28px_rgb(28_26_23/0.35)]">
              <span aria-hidden className="absolute inset-y-0 left-8 w-px bg-pen/35 sm:left-12" />
              <header className="flex items-center justify-between gap-4 border-b border-line py-4 pl-14 pr-5 sm:pl-20 sm:pr-8">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">Énoncé</h2>
                <ActionForm action={unfreezeRubric.bind(null, id)} submitLabel="Dégeler le barème" variant="ghost" />
              </header>
              <div className="py-8 pl-14 pr-6 sm:pl-20 sm:pr-12 [&>div]:text-[17px] [&>div]:leading-8">
                {evaluation.statement ? <RichText source={evaluation.statement} /> : <p className="text-ink-mute">(Énoncé non saisi)</p>}
              </div>
            </article>
            <Card title="Barème">
              <ul className="divide-y divide-line">
                {(criteria ?? []).map((c) => (
                  <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 py-3.5">
                    <div>
                      <p className="font-medium leading-snug">{c.label}</p>
                      {c.expected && <p className="mt-1 text-sm leading-relaxed text-ink-soft">{c.expected}</p>}
                      {c.competencies && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-mute">
                          <span aria-hidden className="size-1.5 rounded-full bg-sage" />
                          {(c.competencies as { label: string }).label}
                        </p>
                      )}
                    </div>
                    <p className="whitespace-nowrap font-display text-xl leading-none text-pen">
                      {formatPoints(c.points)}<span className="ml-0.5 text-xs text-ink-mute">pt</span>
                    </p>
                  </li>
                ))}
                <li className="flex items-baseline justify-between pt-3.5 text-sm text-ink-soft">
                  Total
                  <span className="font-display text-xl text-ink">{formatPoints(evaluation.total_points)}<span className="ml-0.5 text-xs text-ink-mute">pt</span></span>
                </li>
              </ul>
            </Card>
            </>
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
              <p className="mb-4 text-sm text-ink-soft">Le barème est fixé avant toute correction : l&apos;IA corrige selon vos critères, pas selon les siens.</p>
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
        </div>

        <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:[scrollbar-color:var(--color-line-strong)_transparent] lg:[scrollbar-width:thin]">
        <Card className="p-5!">
          <Tabs
            tabs={[
              {
                id: "copies",
                label: "Copies",
                count: `${(copies ?? []).length}/${(students ?? []).length}`,
                content: (
                  <>
                    {!ready && <p className="mb-4 rounded-lg bg-ochre-soft p-3 text-sm text-ochre">Vous pouvez déposer les copies dès maintenant ; l&apos;analyse sera possible une fois le barème figé.</p>}
                    <div className="grid gap-6 @2xl:grid-cols-2">
                      <div className="space-y-4">
                        <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">Déposer une copie</h3>
                        <ScanQr evaluationId={id} siteUrl={await getRequestOrigin()} />
                        <EvaluationUploader
                          evaluationId={id}
                          students={(students ?? []).map((s) => ({ id: s.id, label: `${s.first_name} ${s.last_name}`, done: (copyByStudent.get(s.id)?.file_paths.length ?? 0) > 0 }))}
                        />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">Corriger et publier</h3>
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
                    <table className="mt-8 min-w-full text-sm">
                      <thead><tr className="text-left text-xs uppercase tracking-[0.08em] text-ink-mute"><th className="py-2">Élève</th><th>Statut</th><th>Note</th><th /></tr></thead>
                      <tbody>
                        {(students ?? []).map((s) => {
                          const copy = copyByStudent.get(s.id);
                          return (
                            <tr key={s.id} className="border-t border-line">
                              <td className="py-2">{s.first_name} {s.last_name}</td>
                              <td>{copy ? <CopyStatus status={copy.status} /> : <Badge>Pas de copie</Badge>}</td>
                              <td>{copy?.score != null ? <PenScore score={copy.score} total={evaluation.total_points} /> : <span className="text-ink-mute">–</span>}</td>
                              <td className="text-right">
                                {copy && copy.file_paths.length > 0 && (
                                  <Link className="text-sm font-medium text-ink hover:text-pen" href={`/app/copies/${copy.id}`}>
                                    {copy.status === "proposed" ? "Valider" : "Ouvrir"}
                                  </Link>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                ),
              },
              {
                id: "adaptations",
                label: "Adaptations",
                count: String((variants ?? []).length),
                content: (
                  <>
                    <ActionForm action={createVariant.bind(null, id)} submitLabel={<>Générer une variante <Cost credits={CREDIT_COSTS.variant} /></>} pendingLabel="Génération…">
                      <p className="text-sm text-ink-soft">Ce sont des leviers d&apos;adaptation, pas des diagnostics. Le niveau d&apos;exigence et le total de points sont conservés ; rien sur la feuille n&apos;indique qu&apos;elle est adaptée.</p>
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
                          <div key={v.id} className="rounded-lg border border-line p-4">
                            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                              {v.status === "validated" ? <Badge tone="green">Validée</Badge> : <Badge tone="amber">Proposition</Badge>}
                              <span className="text-ink-soft">{(v.needs as string[]).join(", ")} · intensité {v.intensity}</span>
                              {v.status === "validated" && <Link className="ml-auto text-pen hover:underline" href={`/app/variantes/${v.id}`}>Imprimer</Link>}
                            </div>
                            <details className="mb-2 text-sm">
                              <summary className="cursor-pointer text-ink-soft">Transformations appliquées ({content.transformations.length})</summary>
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
                  </>
                ),
              },
            ]}
          />
        </Card>
        </div>
      </div>
    </>
  );
}
