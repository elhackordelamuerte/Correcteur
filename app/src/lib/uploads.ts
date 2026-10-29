import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { COPIES_BUCKET } from "@/lib/storage";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);
const MAX_FILES = 12;

export type UploadTicket = { copyId: string; uploads: { path: string; token: string }[] };

// Prépare le dépôt direct navigateur → Supabase Storage via URL signées
// (évite la limite de taille des fonctions Vercel)
export async function prepareCopyUpload(
  supabase: SupabaseClient,
  input: { teacherId: string; evaluationId: string; studentId: string; mimeTypes: string[] },
): Promise<UploadTicket> {
  if (input.mimeTypes.length === 0 || input.mimeTypes.length > MAX_FILES) throw new Error("Entre 1 et 12 fichiers.");
  if (input.mimeTypes.some((m) => !ALLOWED.has(m))) throw new Error("Formats acceptés : JPEG, PNG, WebP, PDF.");

  const { data: student } = await supabase
    .from("students")
    .select("id, class_id")
    .eq("id", input.studentId)
    .eq("teacher_id", input.teacherId)
    .single();
  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("id, class_id")
    .eq("id", input.evaluationId)
    .eq("teacher_id", input.teacherId)
    .single();
  if (!student || !evaluation || student.class_id !== evaluation.class_id) throw new Error("Élève ou évaluation invalide.");

  const { data: existing } = await supabase
    .from("copies")
    .select("id,status")
    .eq("evaluation_id", input.evaluationId)
    .eq("student_id", input.studentId)
    .maybeSingle();
  if (existing && ["validated", "published"].includes(existing.status)) throw new Error("Cette copie est déjà validée.");

  let copyId = existing?.id as string | undefined;
  if (!copyId) {
    const { data, error } = await supabase
      .from("copies")
      .insert({ evaluation_id: input.evaluationId, student_id: input.studentId, teacher_id: input.teacherId })
      .select("id")
      .single();
    if (error || !data) throw new Error("Création de la copie impossible.");
    copyId = data.id as string;
  }

  const stamp = Date.now();
  const uploads = await Promise.all(
    input.mimeTypes.map(async (mime, i) => {
      const path = `${input.teacherId}/${input.evaluationId}/${copyId}/${stamp}-${i + 1}.${ALLOWED.get(mime)}`;
      const { data, error } = await supabase.storage.from(COPIES_BUCKET).createSignedUploadUrl(path);
      if (error || !data) throw new Error("Préparation du dépôt impossible.");
      return { path, token: data.token };
    }),
  );
  return { copyId, uploads };
}

// Enregistre les fichiers déposés ; remplace les pages précédentes
export async function finalizeCopyUpload(supabase: SupabaseClient, input: { teacherId: string; copyId: string; paths: string[] }) {
  const prefix = `${input.teacherId}/`;
  if (input.paths.some((p) => !p.startsWith(prefix) || !p.includes(`/${input.copyId}/`))) throw new Error("Chemin invalide.");
  const { data: copy } = await supabase.from("copies").select("file_paths").eq("id", input.copyId).eq("teacher_id", input.teacherId).single();
  if (!copy) throw new Error("Copie introuvable.");
  const stale = (copy.file_paths as string[]).filter((p) => !input.paths.includes(p));
  if (stale.length) await supabase.storage.from(COPIES_BUCKET).remove(stale);
  await supabase
    .from("copies")
    .update({ file_paths: input.paths, status: "uploaded", ai_result: null, transcription: null, error: null })
    .eq("id", input.copyId);
}
