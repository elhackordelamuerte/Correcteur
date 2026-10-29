import { notFound } from "next/navigation";
import { submitExercise } from "@/app/actions/student-space";
import { ActionForm } from "@/components/action-form";
import { Badge, Card, inputClass, PageTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";

export default async function StudentExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole("student");
  const { data: a } = await supabase.from("exercise_assignments").select("*, exercises(title,statement,hints,difficulty)").eq("id", id).single();
  if (!a) notFound();
  const ex = a.exercises as { title: string; statement: string; hints: string[]; difficulty: number };
  return (
    <>
      <PageTitle title={ex.title} subtitle={<Badge>Difficulté {ex.difficulty}/5</Badge>} back={{ href: "/eleve", label: "Accueil" }} />
      <div className="space-y-4">
        <Card><p className="prose-copia">{ex.statement}</p></Card>
        {ex.hints.map((h, i) => (
          <details key={i} className="rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer font-medium text-brand-600">Indice {i + 1}</summary>
            <p className="mt-2 text-slate-700">{h}</p>
          </details>
        ))}
        {a.status === "assigned" ? (
          <Card title="Ta réponse">
            <ActionForm action={submitExercise.bind(null, id)} submitLabel="Envoyer">
              <textarea className={inputClass} name="answer" rows={6} required />
            </ActionForm>
          </Card>
        ) : (
          <Card title="Ta réponse">
            <p className="prose-copia rounded bg-slate-50 p-3">{a.answer}</p>
            {a.status === "corrected" ? (
              <p className="mt-3 text-slate-700"><strong>Retour :</strong> {a.feedback}</p>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Envoyé. Ton prof va le corriger.</p>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
