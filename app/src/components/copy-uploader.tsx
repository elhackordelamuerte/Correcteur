"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { Button, inputClass } from "./ui";

type Ticket = { copyId: string; uploads: { path: string; token: string }[] } | { error: string };

type Props = {
  students: { id: string; label: string; done?: boolean }[];
  prepare: (studentId: string, mimeTypes: string[]) => Promise<Ticket>;
  finalize: (copyId: string, paths: string[]) => Promise<{ error?: string }>;
  onUploaded?: () => void;
  capture?: boolean;
};

const MAX_IMAGE_SIDE = 2000;
const JPEG_QUALITY = 0.82;

// Réduit les photos de téléphone (souvent > 5 Mo) avant l'envoi
async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", JPEG_QUALITY));
}

export function CopyUploader({ students, prepare, finalize, onUploaded, capture = false }: Props) {
  const [studentId, setStudentId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set(students.filter((s) => s.done).map((s) => s.id)));

  async function upload() {
    if (!studentId || files.length === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      const blobs = await Promise.all(files.map(compressImage));
      const ticket = await prepare(studentId, blobs.map((b) => b.type || "image/jpeg"));
      if ("error" in ticket) throw new Error(ticket.error);
      const supabase = createClient();
      await Promise.all(
        ticket.uploads.map(async (u, i) => {
          const { error } = await supabase.storage.from("copies").uploadToSignedUrl(u.path, u.token, blobs[i], { contentType: blobs[i].type });
          if (error) throw new Error("Échec de l'envoi d'une page.");
        }),
      );
      const result = await finalize(ticket.copyId, ticket.uploads.map((u) => u.path));
      if (result.error) throw new Error(result.error);
      setDone((prev) => new Set(prev).add(studentId));
      setMessage({ tone: "ok", text: `Copie enregistrée (${files.length} page${files.length > 1 ? "s" : ""}).` });
      setFiles([]);
      setStudentId("");
      onUploaded?.();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Erreur d'envoi." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <select className={inputClass} value={studentId} onChange={(e) => setStudentId(e.target.value)} disabled={busy}>
        <option value="">— Choisir l&apos;élève —</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {done.has(s.id) ? "✓ " : ""}
            {s.label}
          </option>
        ))}
      </select>
      <input
        className={inputClass}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        multiple
        {...(capture ? { capture: "environment" as const } : {})}
        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        disabled={busy}
      />
      <p className="text-xs text-slate-500">
        Une copie = une ou plusieurs pages. Évitez de photographier le nom de l&apos;élève : il n&apos;est pas utile à l&apos;analyse.
      </p>
      <Button type="button" onClick={upload} disabled={busy || !studentId || files.length === 0} className="w-full sm:w-auto">
        {busy ? "Envoi…" : "Enregistrer la copie"}
      </Button>
      {message && <p className={`text-sm ${message.tone === "ok" ? "text-emerald-700" : "text-red-700"}`}>{message.text}</p>}
    </div>
  );
}
