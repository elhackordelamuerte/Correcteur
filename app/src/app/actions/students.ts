"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateAppreciation } from "@/lib/ai/tasks";
import { fail, ok, type ActionState } from "@/lib/action-state";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { loadCompetencyMap } from "@/lib/competencies";
import { withCredits } from "@/lib/credits";
import { errorMessage } from "@/lib/format";
import { STATUS_LABELS, scrubNames } from "@/lib/rules";
import { COPIES_BUCKET } from "@/lib/storage";

// Proposition d'appréciation (1 crédit) : jamais enregistrée comme validée (PRD-08)
export async function suggestAppreciation(studentId: string, _: ActionState): Promise<ActionState> {
  const { supabase, user } = await requireRole("teacher");
  const { data: student } = await supabase.from("students").select("id, first_name, last_name, classes(subject)").eq("id", studentId).single();
  if (!student) return fail("Élève introuvable.");
  const map = await loadCompetencyMap(supabase, [studentId]);
  const { data: copies } = await supabase.from("copies").select("score, evaluations(total_points)").eq("student_id", studentId).in("status", ["validated", "published"]);
  const notes = (copies ?? []).map((c) => (Number(c.score) / Number((c.evaluations as unknown as { total_points: number }).total_points)) * 20);
  const average = notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : null;
  try {
    const result = await withCredits(supabase, "appreciation", "appréciation", () =>
      generateAppreciation({
        subject: (student.classes as unknown as { subject: string } | null)?.subject ?? "",
        competencies: map.competencies.flatMap((c) => {
          const status = map.status[studentId][c.id];
          return status ? [{ label: c.label, status: STATUS_LABELS[status] }] : [];
        }),
        average,
      }),
    );
    const text = scrubNames(result.text, [student.first_name, student.last_name]);
    await supabase.from("appreciations").upsert({ student_id: studentId, teacher_id: user.id, text, status: "proposal", updated_at: new Date().toISOString() }, { onConflict: "student_id" });
  } catch (error) {
    return fail(errorMessage(error));
  }
  revalidatePath(`/app/eleves/${studentId}`);
  return ok("Proposition générée : relisez-la avant de valider.");
}

export async function saveAppreciation(studentId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireRole("teacher");
  const text = String(formData.get("text") ?? "").trim().slice(0, 800);
  if (text.length < 5) return fail("Appréciation trop courte.");
  const status = formData.get("intent") === "validate" ? "validated" : "proposal";
  const { error } = await supabase.from("appreciations").upsert({ student_id: studentId, teacher_id: user.id, text, status, updated_at: new Date().toISOString() }, { onConflict: "student_id" });
  if (error) return fail("Enregistrement impossible.");
  revalidatePath(`/app/eleves/${studentId}`);
  return ok(status === "validated" ? "Appréciation validée : visible par l'élève." : "Brouillon enregistré.");
}

// Effacement définitif : copies, analyses, observations, profil (F-10.13)
export async function eraseStudent(studentId: string, _: ActionState): Promise<ActionState> {
  const { supabase, user } = await requireRole("teacher");
  const { data: student } = await supabase.from("students").select("id,class_id").eq("id", studentId).single();
  if (!student) return fail("Élève introuvable.");
  const { data: copies } = await supabase.from("copies").select("file_paths").eq("student_id", studentId);
  const paths = (copies ?? []).flatMap((c) => c.file_paths as string[]);
  if (paths.length) await supabase.storage.from(COPIES_BUCKET).remove(paths);
  const { error } = await supabase.from("students").delete().eq("id", studentId);
  if (error) return fail("Effacement impossible.");
  await audit(supabase, user.id, "erase_student", studentId);
  redirect(`/app/classes/${student.class_id}`);
}
