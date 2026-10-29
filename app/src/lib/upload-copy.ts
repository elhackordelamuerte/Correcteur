// Pipeline d'envoi d'une copie, partagé par l'ordinateur et le téléphone :
// compression → URL signées (prepare) → dépôt direct Supabase Storage → finalize
import { createClient } from "@/lib/supabase/browser";

export type CopyTicket = { copyId: string; uploads: { path: string; token: string }[] } | { error: string };
export type PrepareCopy = (studentId: string, mimeTypes: string[]) => Promise<CopyTicket>;
export type FinalizeCopy = (copyId: string, paths: string[]) => Promise<{ error?: string }>;

export const MAX_COPY_PAGES = 12; // même limite que src/lib/uploads.ts
export const MAX_IMAGE_SIDE = 2000;
export const JPEG_QUALITY = 0.82;

export function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Conversion de l'image impossible."))), "image/jpeg", JPEG_QUALITY),
  );
}

// Réduit les photos de téléphone (souvent > 5 Mo) avant l'envoi ; les PDF passent tels quels
export async function compressImage(file: Blob): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvasToJpeg(canvas).catch(() => file);
}

type UploadInput = {
  studentId: string;
  pages: Blob[];
  prepare: PrepareCopy;
  finalize: FinalizeCopy;
  onProgress?: (sent: number, total: number) => void;
};

// Envoie des pages déjà compressées ; lève une erreur au message lisible en cas d'échec
export async function uploadCopy({ studentId, pages, prepare, finalize, onProgress }: UploadInput): Promise<void> {
  if (pages.length === 0) throw new Error("Aucune page à envoyer.");
  if (pages.length > MAX_COPY_PAGES) throw new Error(`${MAX_COPY_PAGES} pages maximum par copie.`);
  const ticket = await prepare(studentId, pages.map((b) => b.type || "image/jpeg"));
  if ("error" in ticket) throw new Error(ticket.error);
  const supabase = createClient();
  let sent = 0;
  onProgress?.(0, pages.length);
  await Promise.all(
    ticket.uploads.map(async (u, i) => {
      const { error } = await supabase.storage.from("copies").uploadToSignedUrl(u.path, u.token, pages[i], { contentType: pages[i].type });
      if (error) throw new Error("Échec de l'envoi d'une page. Vérifiez la connexion et réessayez.");
      sent += 1;
      onProgress?.(sent, pages.length);
    }),
  );
  const result = await finalize(ticket.copyId, ticket.uploads.map((u) => u.path));
  if (result.error) throw new Error(result.error);
}
