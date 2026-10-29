import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Attachment } from "@/lib/ai/providers";

export const COPIES_BUCKET = "copies";
const SIGNED_URL_TTL_SECONDS = 3600; // 1 h (ADR-010)

export async function signedUrls(supabase: SupabaseClient, paths: string[]): Promise<string[]> {
  if (paths.length === 0) return [];
  const { data } = await supabase.storage.from(COPIES_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  return (data ?? []).map((d) => d.signedUrl ?? "").filter(Boolean);
}

// Télécharge les fichiers d'une copie pour l'analyse (jamais d'URL publique)
export async function loadAttachments(supabase: SupabaseClient, paths: string[]): Promise<Attachment[]> {
  return Promise.all(
    paths.map(async (path) => {
      const { data, error } = await supabase.storage.from(COPIES_BUCKET).download(path);
      if (error || !data) throw new Error("Fichier de copie introuvable");
      const buffer = Buffer.from(await data.arrayBuffer());
      return { mimeType: data.type || guessMime(path), base64: buffer.toString("base64") };
    }),
  );
}

function guessMime(path: string): string {
  if (path.endsWith(".pdf")) return "application/pdf";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}
