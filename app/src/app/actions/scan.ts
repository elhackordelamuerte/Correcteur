"use server";

import { errorMessage } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/server";
import { finalizeCopyUpload, prepareCopyUpload, type UploadTicket } from "@/lib/uploads";

// Page de scan sans compte : le jeton (aléatoire, 2 h) fait office d'autorisation (ADR-012)
export async function loadScanSession(token: string) {
  if (!/^[a-f0-9]{36}$/.test(token)) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("scan_sessions").select("*").eq("token", token).gt("expires_at", new Date().toISOString()).maybeSingle();
  return data as { token: string; teacher_id: string; evaluation_id: string; expires_at: string } | null;
}

export async function scanPrepareUpload(token: string, studentId: string, mimeTypes: string[]): Promise<UploadTicket | { error: string }> {
  const session = await loadScanSession(token);
  if (!session) return { error: "Session de scan expirée : générez un nouveau QR code." };
  try {
    return await prepareCopyUpload(createAdminClient(), { teacherId: session.teacher_id, evaluationId: session.evaluation_id, studentId, mimeTypes });
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function scanFinalizeUpload(token: string, copyId: string, paths: string[]): Promise<{ error?: string }> {
  const session = await loadScanSession(token);
  if (!session) return { error: "Session de scan expirée." };
  try {
    await finalizeCopyUpload(createAdminClient(), { teacherId: session.teacher_id, copyId, paths });
    return {};
  } catch (error) {
    return { error: errorMessage(error) };
  }
}
