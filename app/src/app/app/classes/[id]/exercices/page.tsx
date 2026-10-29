import { notFound } from "next/navigation";
import { aiCorrectAssignment, assignExercise, createExercise, manualCorrectAssignment } from "@/app/actions/exercises";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, Cost, Empty, Field, inputClass, PageTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { CREDIT_COSTS } from "@/lib/rules";

export const maxDuration = 60;

export default async function ExercisesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole("teacher");
  const { data: klass } = await supabase.from("classes").select("id,name").eq("id", id).single();
  if (!klass) notFound();
  const [{ data: exercises }, { data: competencies }] = await Promise.all([
    supabase
      .from("exercises")
      .select("*, competencies(label), exercise_assignments(id,status,answer,feedback,ratio,corrected_by, students(first_name,last_name))")
      .eq("class_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("competencies").select("label").order("label"),
  ]);

  return (
    <>
      <PageTitle title="Exercices de remédiation" subtitle="Un exercice cible une compétence, avec deux indices et une difficulté de 1 à 5." back={{ href: `/app/classes/${id}`, label: klass.name }} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {(exercises ?? []).length === 0 && <Empty>Aucun exercice pour l&apos;instant.</Empty>}
          {(exercises ?? []).map((ex) => {
            const assignments = ex.exercise_assignments as { id: string; status: string; answer: string | null; feedback: string | null; ratio: number | null; corrected_by: string | null; students: { first_name: string; last_name: string } }[];
            return (
              <Card key={ex.id} title={ex.title} actions={<span className="flex gap-2"><Badge tone="blue">{(ex.competencies as { label: string } | null)?.label ?? "Sans compétence"}</Badge><Badge>Difficulté {ex.difficulty}/5</Badge></span>}>
                <p className="prose-copia text-sm">{ex.statement}</p>
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer text-slate-600">Indices et solution</summary>
                  <ol className="ml-5 mt-2 list-decimal">{(ex.hints as string[]).map((h) => <li key={h}>{h}</li>)}</ol>
                  <p className="prose-copia mt-2 text-slate-600">{ex.solution}</p>
                </details>
                <ActionForm action={assignExercise.bind(null, ex.id)} submitLabel="Assigner" variant="secondary" className="mt-4 flex flex-wrap items-center gap-3">
                  <select name="target" className={`${inputClass} w-auto`}>
                    <option value="fragile">Élèves « à besoins » ou « fragiles » sur cette compétence</option>
                    <option value="all">Toute la classe</option>
                  </select>
                </ActionForm>
                {assignments.length > 0 && (
                  <ul className="mt-4 divide-y divide-slate-100 text-sm">
                    {assignments.map((a) => (
                      <li key={a.id} className="space-y-2 py-3">
                        <div className="flex justify-between">
                          <span>{a.students.first_name} {a.students.last_name}</span>
                          {a.status === "assigned" && <Badge>En attente</Badge>}
                          {a.status === "submitted" && <Badge tone="amber">Rendu</Badge>}
                          {a.status === "corrected" && <Badge tone="green">Corrigé {a.corrected_by === "ai" ? "(IA)" : ""} · {Math.round(Number(a.ratio) * 100)} %</Badge>}
                        </div>
                        {a.answer && <p className="rounded bg-slate-50 p-2 text-slate-700">{a.answer}</p>}
                        {a.feedback && <p className="text-slate-600">↳ {a.feedback}</p>}
                        {a.status === "submitted" && (
                          <div className="flex flex-wrap items-start gap-4">
                            <ActionForm action={aiCorrectAssignment.bind(null, a.id)} submitLabel={<>Corriger par l&apos;IA <Cost credits={CREDIT_COSTS.exerciseCorrection} /></>} variant="secondary" />
                            <ActionForm action={manualCorrectAssignment.bind(null, a.id)} submitLabel="Corriger moi-même" variant="ghost" className="flex flex-wrap items-center gap-2">
                              <input className={`${inputClass} w-20`} name="ratio" type="number" min={0} max={100} placeholder="%" required />
                              <input className={`${inputClass} w-64`} name="feedback" placeholder="Retour à l'élève" />
                            </ActionForm>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
        <div className="space-y-6">
          <Card title="Générer un exercice">
            <ActionForm action={createExercise.bind(null, id)} submitLabel={<>Générer <Cost credits={CREDIT_COSTS.exercise} /></>} pendingLabel="Génération…">
              <input type="hidden" name="mode" value="ai" />
              <Field label="Compétence ciblée">
                <input className={inputClass} name="competency" list="competencies" required />
              </Field>
              <Field label="Difficulté (1 à 5)"><input className={inputClass} name="difficulty" type="number" min={1} max={5} defaultValue={2} /></Field>
              <Field label="Erreurs observées (facultatif)"><textarea className={inputClass} name="context" rows={2} /></Field>
            </ActionForm>
          </Card>
          <Card title="Créer à la main">
            <ActionForm action={createExercise.bind(null, id)} submitLabel={<>Créer <Cost credits={0} /></>} variant="secondary">
              <input type="hidden" name="mode" value="manual" />
              <Field label="Compétence"><input className={inputClass} name="competency" list="competencies" required /></Field>
              <Field label="Titre"><input className={inputClass} name="title" /></Field>
              <Field label="Énoncé"><textarea className={inputClass} name="statement" rows={3} required /></Field>
              <Field label="Indice 1"><input className={inputClass} name="hint1" required /></Field>
              <Field label="Indice 2"><input className={inputClass} name="hint2" required /></Field>
              <Field label="Solution"><textarea className={inputClass} name="solution" rows={2} /></Field>
              <Field label="Difficulté"><input className={inputClass} name="difficulty" type="number" min={1} max={5} defaultValue={2} /></Field>
            </ActionForm>
          </Card>
          <datalist id="competencies">{(competencies ?? []).map((c) => <option key={c.label} value={c.label} />)}</datalist>
        </div>
      </div>
    </>
  );
}
