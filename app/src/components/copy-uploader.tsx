"use client";

import { useState } from "react";
import { compressImage, type FinalizeCopy, type PrepareCopy, uploadCopy } from "@/lib/upload-copy";
import { Button, inputClass } from "./ui";

type Props = {
  students: { id: string; label: string; done?: boolean }[];
  prepare: PrepareCopy;
  finalize: FinalizeCopy;
  onUploaded?: () => void;
};

// Dépôt d'une copie depuis l'ordinateur (sélection de fichiers, sans appareil photo)
export function CopyUploader({ students, prepare, finalize, onUploaded }: Props) {
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
      const pages = await Promise.all(files.map(compressImage));
      await uploadCopy({ studentId, pages, prepare, finalize });
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
        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        disabled={busy}
      />
      <p className="text-xs text-ink-mute">
        Une copie = une ou plusieurs pages. Évitez de photographier le nom de l&apos;élève : il n&apos;est pas utile à l&apos;analyse.
      </p>
      <Button type="button" onClick={upload} disabled={busy || !studentId || files.length === 0} className="w-full sm:w-auto">
        {busy ? "Envoi…" : "Enregistrer la copie"}
      </Button>
      {message && <p className={`text-sm ${message.tone === "ok" ? "text-sage" : "text-pen"}`}>{message.text}</p>}
    </div>
  );
}
