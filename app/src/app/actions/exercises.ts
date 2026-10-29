"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { correctExercise, generateExercise } from "@/lib/ai/tasks";
import { fail, ok, type ActionState } from "@/lib/action-state";
import { requireRole } from "@/lib/auth";
import { withCredits } from "@/lib/credits";
import { errorMessage } from "@/lib/format";
import { aggregateStatus } from "@/lib/rules";
import type { SupabaseClient } from "@supabase/supabase-js";

const generateSchema = z.object({
  competency: z.string().trim().min(2).max(120),
  difficulty: z.coerce.number().int().min(1).max(5),
  context: z.string().trim().max(1000).default(""),
});

// Exercice ciblé : 1 crédit, ou création manuelle gratuite (PRD-05)
export async function createExercise(classId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireRole("teacher");
  const parsed = generateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Indiquez la compétence ciblée.");
  const { data: klass } = await supabase.from("classes").select("level,subject").eq("id", classId).single();
  if (!klass) return fail("Classe introuvable.");
  await supabase.from("competencies").upsert({ teacher_id: user.id, label: parsed.data.competency }, { onConflict: "teacher_id,label", ignoreDuplicates: true });
  const { data: competency } = await supabase.from("competencies").select("id").eq("label", parsed.data.competency).single();

  const manual = formData.get("mode") === "manual";
  try {
    const exercise = manual
      ? {
          title: String(formData.get("title") ?? parsed.data.competency).slice(0, 200),
          statement: String(formData.get("statement") ?? "").slice(0, 4000),
          hints: [String(formData.get("hint1") ?? ""), String(formData.get("hint2") ?? "")],
          solution: String(formData.get("solution") ?? "").slice(0, 4000),
          difficulty: parsed.data.difficulty,
        }
      : await withCredits(supabase, "exercise", "exercice ciblé", () =>
          generateExercise({ subject: klass.subject, level: klass.level, competency: parsed.data.competency, difficulty: parsed.data.difficulty, context: parsed.data.context }),
        );
    if (manual && (exercise.statement.length < 5 || exercise.hints.some((h) => h.trim().length < 2))) {
      return fail("Énoncé et deux indices requis.");
    }
    const { error } = await supabase.from("exercises").insert({ ...exercise, teacher_id: user.id, class_id: classId, competency_id: competency?.id ?? null });
    if (error) return fail("Enregistrement impossible.");
  } catch (error) {
    return fail(errorMessage(error));
  }
  revalidatePath(`/app/classes/${classId}/exercices`);
  return ok("Exercice créé.");
}

async function targetStudents(supabase: SupabaseClient, classId: string, competencyId: string | null, target: string) {
  const { data: students } = await supabase.from("students").select("id").eq("class_id", classId);
  const ids = (students ?? []).map((s) => s.id as string);
  if (target === "all" || !competencyId) return ids;
  const { data: obs } = await supabase
    .from("competency_observations")
    .select("student_id,ratio,created_at")
    .eq("competency_id", competencyId)
    .in("student_id", ids)
    .order("created_at", { ascending: false });
  // Élèves dont la compétence est « à besoins » ou « fragile »
  return ids.filter((id) => {
    const status = aggregateStatus((obs ?? []).filter((o) => o.student_id === id).map((o) => Number(o.ratio)));
    return status === "besoin" || status === "fragile";
  });
}

export async function assignExercise(exerciseId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireRole("teacher");
  const { data: exercise } = await supabase.from("exercises").select("class_id,competency_id").eq("id", exerciseId).single();
  if (!exercise) return fail("Exercice introuvable.");
  const ids = await targetStudents(supabase, exercise.class_id, exercise.competency_id, String(formData.get("target") ?? "all"));
  if (ids.length === 0) return fail("Aucun élève concerné.");
  await supabase
    .from("exercise_assignments")
    .upsert(ids.map((student_id) => ({ exercise_id: exerciseId, student_id, teacher_id: user.id })), { onConflict: "exercise_id,student_id", ignoreDuplicates: true });
  revalidatePath(`/app/classes/${exercise.class_id}/exercices`);
  return ok(`Assigné à ${ids.length} élève(s).`);
}

async function recordExerciseObservation(supabase: SupabaseClient, teacherId: string, assignmentId: string, ratio: number) {
  const { data } = await supabase.from("exercise_assignments").select("student_id, exercises(competency_id)").eq("id", assignmentId).single();
  const competencyId = (data?.exercises as unknown as { competency_id: string | null } | null)?.competency_id;
  if (!data || !competencyId) return;
  await supabase.from("competency_observations").upsert(
    { teacher_id: teacherId, student_id: data.student_id, competency_id: competencyId, source_type: "exercise", source_id: assignmentId, ratio },
    { onConflict: "source_type,source_id,competency_id" },
  );
}

// Correction IA d'une réponse d'élève : 1 crédit
export async function aiCorrectAssignment(assignmentId: string, _: ActionState): Promise<ActionState> {
  const { supabase, user } = await requireRole("teacher");
  const { data: a } = await supabase.from("exercise_assignments").select("*, exercises(statement,solution,class_id)").eq("id", assignmentId).single();
  if (!a || a.status !== "submitted") return fail("Aucune réponse à corriger.");
  try {
    const result = await withCredits(supabase, "exerciseCorrection", "correction d'exercice", () =>
      correctExercise({ statement: a.exercises.statement, solution: a.exercises.solution, answer: a.answer ?? "" }),
    );
    await supabase.from("exercise_assignments").update({ status: "corrected", feedback: result.feedback, ratio: result.ratio, corrected_by: "ai" }).eq("id", assignmentId);
    await recordExerciseObservation(supabase, user.id, assignmentId, result.ratio);
  } catch (error) {
    return fail(errorMessage(error));
  }
  revalidatePath(`/app/classes/${a.exercises.class_id}/exercices`);
  return ok("Corrigé.");
}

// Correction manuelle : gratuite
export async function manualCorrectAssignment(assignmentId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireRole("teacher");
  const ratio = Math.min(1, Math.max(0, Number(formData.get("ratio") ?? 0) / 100));
  const feedback = String(formData.get("feedback") ?? "").slice(0, 1200);
  const { data: a } = await supabase
    .from("exercise_assignments")
    .update({ status: "corrected", feedback, ratio, corrected_by: "teacher" })
    .eq("id", assignmentId)
    .select("exercises(class_id)")
    .single();
  if (!a) return fail("Correction impossible.");
  await recordExerciseObservation(supabase, user.id, assignmentId, ratio);
  revalidatePath(`/app/classes/${(a.exercises as unknown as { class_id: string }).class_id}/exercices`);
  return ok("Corrigé.");
}
