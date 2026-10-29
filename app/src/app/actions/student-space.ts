"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionState } from "@/lib/action-state";
import { requireRole } from "@/lib/auth";

const joinSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z2-9]{6}$/, "Le code classe comporte 6 caractères."),
  first_name: z.string().trim().min(1).max(60),
  last_name: z.string().trim().min(1).max(80),
});

export async function joinClass(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireRole("student");
  const parsed = joinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");
  const { error } = await supabase.rpc("join_class", { p_code: parsed.data.code, p_first_name: parsed.data.first_name, p_last_name: parsed.data.last_name });
  if (error) return fail(error.message.includes("inconnu") ? "Code classe inconnu." : "Impossible de rejoindre la classe.");
  revalidatePath("/eleve");
  return ok("Classe rejointe !");
}

export async function submitExercise(assignmentId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireRole("student");
  const answer = String(formData.get("answer") ?? "").trim();
  if (answer.length < 1) return fail("Écris ta réponse avant d'envoyer.");
  const { error } = await supabase.rpc("submit_exercise", { p_assignment: assignmentId, p_answer: answer });
  if (error) return fail("Envoi impossible : exercice déjà rendu ?");
  revalidatePath(`/eleve/exercices/${assignmentId}`);
  return ok("Réponse envoyée à ton professeur.");
}
