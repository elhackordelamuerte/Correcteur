"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionState } from "@/lib/action-state";
import { requireRole } from "@/lib/auth";
import { getAccount } from "@/lib/credits";
import { generateJoinCode } from "@/lib/rules";
import { rowKey } from "@/lib/roster";

const PRO_MAX_CLASSES = 3;
const MAX_JOIN_CODE_ATTEMPTS = 5;

const classSchema = z.object({
  name: z.string().trim().min(1).max(80),
  level: z.string().trim().max(40),
  subject: z.string().trim().max(60),
});

export async function createClass(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireRole("teacher");
  const parsed = classSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Nom de classe requis.");

  // Forfait Pro : 3 classes maximum (PRD-09)
  const account = await getAccount(supabase, user.id);
  if (account?.plan === "pro") {
    const { count } = await supabase.from("classes").select("id", { count: "exact", head: true });
    if ((count ?? 0) >= PRO_MAX_CLASSES) return fail("Le forfait Pro est limité à 3 classes.");
  }

  for (let attempt = 0; attempt < MAX_JOIN_CODE_ATTEMPTS; attempt++) {
    const { error } = await supabase.from("classes").insert({ ...parsed.data, teacher_id: user.id, join_code: generateJoinCode() });
    if (!error) {
      revalidatePath("/app");
      return ok("Classe créée.");
    }
    if (error.code !== "23505") return fail("Création impossible.");
  }
  return fail("Création impossible, réessayez.");
}

const studentRowSchema = z.object({
  first_name: z.string().trim().min(1).max(60),
  last_name: z.string().trim().max(80),
});
const MAX_STUDENTS_PER_BATCH = 60;

// Ajout en lot depuis le panneau (saisie ou liste collée) ; doublons ignorés côté serveur
export async function addStudentsBatch(classId: string, rows: { first_name: string; last_name: string }[]): Promise<{ added?: number; skipped?: number; error?: string }> {
  const { supabase, user } = await requireRole("teacher");
  const parsed = z.array(studentRowSchema).min(1).max(MAX_STUDENTS_PER_BATCH).safeParse(rows);
  if (!parsed.success) return { error: "Chaque élève doit avoir au moins un prénom." };
  const { data: existing } = await supabase.from("students").select("first_name,last_name").eq("class_id", classId);
  const seen = new Set((existing ?? []).map(rowKey));
  const fresh = parsed.data.filter((r) => {
    const key = rowKey(r);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (fresh.length > 0) {
    const { error } = await supabase.from("students").insert(fresh.map((r) => ({ ...r, class_id: classId, teacher_id: user.id })));
    if (error) return { error: "Ajout impossible." };
  }
  revalidatePath(`/app/classes/${classId}`);
  return { added: fresh.length, skipped: parsed.data.length - fresh.length };
}

export async function renameStudent(studentId: string, row: { first_name: string; last_name: string }): Promise<{ error?: string }> {
  const { supabase } = await requireRole("teacher");
  const parsed = studentRowSchema.safeParse(row);
  if (!parsed.success) return { error: "Prénom requis." };
  const { data, error } = await supabase.from("students").update(parsed.data).eq("id", studentId).select("class_id").single();
  if (error || !data) return { error: "Modification impossible." };
  revalidatePath(`/app/classes/${data.class_id}`);
  return {};
}

// Retrait de la classe : distinct de l'effacement RGPD (qui supprime tout)
export async function regenerateJoinCode(classId: string, _: ActionState): Promise<ActionState> {
  const { supabase } = await requireRole("teacher");
  const { error } = await supabase.from("classes").update({ join_code: generateJoinCode() }).eq("id", classId);
  if (error) return fail("Impossible de régénérer le code.");
  revalidatePath(`/app/classes/${classId}`);
  return ok("Nouveau code généré.");
}
