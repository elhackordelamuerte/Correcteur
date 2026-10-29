"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { generateEvaluation, generateRubric, generateVariant } from "@/lib/ai/tasks";
import { fail, ok, type ActionState } from "@/lib/action-state";
import { requireRole } from "@/lib/auth";
import { withCredits } from "@/lib/credits";
import { errorMessage } from "@/lib/format";
import { DYS_NEEDS, rubricTotal } from "@/lib/rules";
import type { SupabaseClient } from "@supabase/supabase-js";

const createSchema = z.object({
  class_id: z.uuid(),
  title: z.string().trim().max(200).default(""),
  topic: z.string().trim().max(2000).default(""),
  statement: z.string().max(12000).default(""),
  total_points: z.coerce.number().positive().max(200),
  duration: z.coerce.number().int().min(10).max(240).default(55),
  mode: z.enum(["manual", "ai"]),
});

// Retrouve (ou crée) les compétences par libellé pour cet enseignant
async function competencyIds(supabase: SupabaseClient, teacherId: string, labels: string[]) {
  const unique = [...new Set(labels.map((l) => l.trim()).filter(Boolean))];
  if (unique.length === 0) return new Map<string, string>();
  await supabase.from("competencies").upsert(unique.map((label) => ({ teacher_id: teacherId, label })), { onConflict: "teacher_id,label", ignoreDuplicates: true });
  const { data } = await supabase.from("competencies").select("id,label").in("label", unique);
  return new Map((data ?? []).map((c) => [c.label as string, c.id as string]));
}

async function insertCriteria(
  supabase: SupabaseClient,
  teacherId: string,
  evaluationId: string,
  criteria: { label: string; expected: string; points: number; competency?: string }[],
) {
  const ids = await competencyIds(supabase, teacherId, criteria.map((c) => c.competency ?? ""));
  await supabase.from("criteria").delete().eq("evaluation_id", evaluationId);
  if (criteria.length === 0) return;
  const { error } = await supabase.from("criteria").insert(
    criteria.map((c, position) => ({
      evaluation_id: evaluationId,
      teacher_id: teacherId,
      position,
      label: c.label,
      expected: c.expected,
      points: c.points,
      competency_id: c.competency ? (ids.get(c.competency.trim()) ?? null) : null,
    })),
  );
  if (error) throw new Error("Enregistrement du barème impossible.");
}

export async function createEvaluation(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireRole("teacher");
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Formulaire incomplet.");
  const input = parsed.data;
  const { data: klass } = await supabase.from("classes").select("level,subject").eq("id", input.class_id).single();
  if (!klass) return fail("Classe introuvable.");

  let evaluationId: string;
  try {
    if (input.mode === "ai") {
      if (input.topic.length < 3) return fail("Décrivez le sujet de l'évaluation.");
      // Évaluation complète générée : 2 crédits, restitués si l'enregistrement échoue
      evaluationId = await withCredits(supabase, "evaluation", "génération d'évaluation", async () => {
        const draft = await generateEvaluation({ subject: klass.subject, level: klass.level, topic: input.topic, totalPoints: input.total_points, durationMinutes: input.duration });
        const { data, error } = await supabase
          .from("evaluations")
          .insert({ teacher_id: user.id, class_id: input.class_id, title: draft.title, subject: klass.subject, level: klass.level, statement: draft.statement, total_points: input.total_points })
          .select("id")
          .single();
        if (error || !data) throw new Error("Création impossible.");
        await insertCriteria(supabase, user.id, data.id, draft.criteria);
        return data.id as string;
      });
    } else {
      if (!input.title) return fail("Titre requis.");
      const { data, error } = await supabase
        .from("evaluations")
        .insert({ teacher_id: user.id, class_id: input.class_id, title: input.title, subject: klass.subject, level: klass.level, statement: input.statement, total_points: input.total_points })
        .select("id")
        .single();
      if (error || !data) return fail("Création impossible.");
      evaluationId = data.id;
    }
  } catch (error) {
    return fail(errorMessage(error));
  }
  redirect(`/app/evaluations/${evaluationId}`);
}

async function loadDraft(supabase: SupabaseClient, evaluationId: string) {
  const { data } = await supabase.from("evaluations").select("*").eq("id", evaluationId).single();
  if (!data) throw new Error("Évaluation introuvable.");
  if (data.status !== "draft") throw new Error("Le barème est figé : dégelez-le pour le modifier.");
  return data;
}

// Barème proposé par l'IA (offert)
export async function suggestRubric(evaluationId: string, _: ActionState): Promise<ActionState> {
  const { supabase, user } = await requireRole("teacher");
  try {
    const evaluation = await loadDraft(supabase, evaluationId);
    if (evaluation.statement.trim().length < 10) return fail("Saisissez d'abord l'énoncé.");
    const criteria = await withCredits(supabase, "rubric", "barème", () =>
      generateRubric({ statement: evaluation.statement, subject: evaluation.subject, level: evaluation.level, totalPoints: Number(evaluation.total_points) }),
    );
    await insertCriteria(supabase, user.id, evaluationId, criteria);
  } catch (error) {
    return fail(errorMessage(error));
  }
  revalidatePath(`/app/evaluations/${evaluationId}`);
  return ok("Barème proposé : relisez-le avant de le figer.");
}

const rubricRowSchema = z.object({
  label: z.string().trim().min(1).max(200),
  expected: z.string().trim().max(1000),
  points: z.coerce.number().positive().max(100),
  competency: z.string().trim().max(120),
});

// Enregistrement de l'énoncé et du barème édités à la main (gratuit)
export async function saveEvaluation(evaluationId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireRole("teacher");
  try {
    await loadDraft(supabase, evaluationId);
    const labels = formData.getAll("label").map(String);
    const rows = labels
      .map((label, i) => ({
        label,
        expected: String(formData.getAll("expected")[i] ?? ""),
        points: String(formData.getAll("points")[i] ?? ""),
        competency: String(formData.getAll("competency")[i] ?? ""),
      }))
      .filter((r) => r.label.trim());
    const criteria = rows.map((r) => rubricRowSchema.parse(r));
    await supabase
      .from("evaluations")
      .update({ title: String(formData.get("title") ?? "").slice(0, 200), statement: String(formData.get("statement") ?? "").slice(0, 12000) })
      .eq("id", evaluationId);
    await insertCriteria(supabase, user.id, evaluationId, criteria);
  } catch (error) {
    return fail(error instanceof z.ZodError ? "Chaque critère doit avoir un libellé et des points positifs." : errorMessage(error));
  }
  revalidatePath(`/app/evaluations/${evaluationId}`);
  return ok("Enregistré.");
}

// Fige le barème : la somme doit tomber exactement sur le total (ADR-006)
export async function freezeRubric(evaluationId: string, _: ActionState): Promise<ActionState> {
  const { supabase } = await requireRole("teacher");
  const { data: evaluation } = await supabase.from("evaluations").select("total_points").eq("id", evaluationId).single();
  const { data: criteria } = await supabase.from("criteria").select("points").eq("evaluation_id", evaluationId);
  if (!evaluation || !criteria?.length) return fail("Ajoutez au moins un critère.");
  const sum = rubricTotal(criteria.map((c) => Number(c.points)));
  if (sum !== Number(evaluation.total_points)) {
    return fail(`La somme du barème (${sum}) ne correspond pas au total (${evaluation.total_points}).`);
  }
  await supabase.from("evaluations").update({ status: "ready" }).eq("id", evaluationId);
  revalidatePath(`/app/evaluations/${evaluationId}`);
  return ok("Barème figé : la correction peut commencer.");
}

export async function unfreezeRubric(evaluationId: string, _: ActionState): Promise<ActionState> {
  const { supabase } = await requireRole("teacher");
  const { count } = await supabase
    .from("copies")
    .select("id", { count: "exact", head: true })
    .eq("evaluation_id", evaluationId)
    .in("status", ["analyzing", "proposed", "validated", "published"]);
  if ((count ?? 0) > 0) return fail("Des copies sont déjà corrigées : le barème ne peut plus changer.");
  await supabase.from("evaluations").update({ status: "draft" }).eq("id", evaluationId);
  revalidatePath(`/app/evaluations/${evaluationId}`);
  return ok("Barème dégelé.");
}

// Variante DYS / PAP : 2 crédits, quelle que soit l'intensité (PRD-07)
export async function createVariant(evaluationId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireRole("teacher");
  const needs = formData.getAll("needs").map(String).filter((n) => (DYS_NEEDS as readonly string[]).includes(n));
  const intensity = Number(formData.get("intensity"));
  if (needs.length === 0) return fail("Choisissez au moins un besoin.");
  if (![1, 2, 3].includes(intensity)) return fail("Intensité invalide.");
  const { data: evaluation } = await supabase.from("evaluations").select("*").eq("id", evaluationId).single();
  const { data: criteria } = await supabase.from("criteria").select("id,label,expected,points").eq("evaluation_id", evaluationId).order("position");
  if (!evaluation || !criteria?.length) return fail("Complétez l'énoncé et le barème d'abord.");
  try {
    const variant = await withCredits(supabase, "variant", "variante DYS/PAP", () =>
      generateVariant({
        statement: evaluation.statement,
        criteria: criteria.map((c) => ({ ...c, points: Number(c.points) })),
        needs,
        intensity,
        totalPoints: Number(evaluation.total_points),
      }),
    );
    await supabase.from("variants").insert({ evaluation_id: evaluationId, teacher_id: user.id, needs, intensity, content: variant });
  } catch (error) {
    return fail(errorMessage(error));
  }
  revalidatePath(`/app/evaluations/${evaluationId}`);
  return ok("Variante proposée : relisez-la puis validez-la.");
}

// Toute modification repasse la variante en « proposition » (F-07.7)
export async function updateVariant(variantId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireRole("teacher");
  const { data: variant } = await supabase.from("variants").select("content,evaluation_id").eq("id", variantId).single();
  if (!variant) return fail("Variante introuvable.");
  const validate = formData.get("intent") === "validate";
  const statement = String(formData.get("statement") ?? "").slice(0, 12000);
  const changed = statement !== variant.content.statement;
  await supabase
    .from("variants")
    .update({ content: { ...variant.content, statement }, status: validate && !changed ? "validated" : "proposal" })
    .eq("id", variantId);
  revalidatePath(`/app/evaluations/${variant.evaluation_id}`);
  if (validate && changed) return ok("Modifications enregistrées : relisez puis validez à nouveau.");
  return ok(validate ? "Variante validée : elle peut être imprimée." : "Modifications enregistrées.");
}
