"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, type ActionState } from "@/lib/action-state";
import { requireRole } from "@/lib/auth";
import { getAccount } from "@/lib/credits";
import { generateJoinCode } from "@/lib/rules";

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

// Ajout en lot : une ligne par élève « Prénom Nom »
export async function addStudents(classId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireRole("teacher");
  const rows = String(formData.get("names") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 60)
    .map((line) => {
      const [first, ...rest] = line.split(/\s+/);
      return { class_id: classId, teacher_id: user.id, first_name: first.slice(0, 60), last_name: rest.join(" ").slice(0, 80) };
    });
  if (rows.length === 0) return fail("Saisissez au moins un élève.");
  const { error } = await supabase.from("students").insert(rows);
  if (error) return fail("Ajout impossible.");
  revalidatePath(`/app/classes/${classId}`);
  return ok(`${rows.length} élève(s) ajouté(s).`);
}

// Retrait de la classe : distinct de l'effacement RGPD (qui supprime tout)
export async function regenerateJoinCode(classId: string, _: ActionState): Promise<ActionState> {
  const { supabase } = await requireRole("teacher");
  const { error } = await supabase.from("classes").update({ join_code: generateJoinCode() }).eq("id", classId);
  if (error) return fail("Impossible de régénérer le code.");
  revalidatePath(`/app/classes/${classId}`);
  return ok("Nouveau code généré.");
}
