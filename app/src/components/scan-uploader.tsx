"use client";

import { useEffect, useState } from "react";
import { scanFinalizeUpload, scanPrepareUpload } from "@/app/actions/scan";
import { uploadCopy } from "@/lib/upload-copy";
import { DocumentScanner } from "./document-scanner";

type Student = { id: string; label: string; done?: boolean };
type Upload = { label: string; pages: number; sent: number };

const TOAST_MS = 3500;

function pagesLabel(count: number): string {
  return `${count} page${count > 1 ? "s" : ""}`;
}

// Page de scan sur téléphone : liste d'élèves → scanner → envoi → élève suivant
export function ScanUploader({ token, title, students }: { token: string; title: string; students: Student[] }) {
  const [done, setDone] = useState<Set<string>>(() => new Set(students.filter((s) => s.done).map((s) => s.id)));
  const [active, setActive] = useState<Student | null>(null);
  const [upload, setUpload] = useState<Upload | null>(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function send(student: Student, pages: Blob[]) {
    setActive(null);
    setError("");
    setUpload({ label: student.label, pages: pages.length, sent: 0 });
    try {
      await uploadCopy({
        studentId: student.id,
        pages,
        prepare: (studentId, mimes) => scanPrepareUpload(token, studentId, mimes),
        finalize: (copyId, paths) => scanFinalizeUpload(token, copyId, paths),
        onProgress: (sent) => setUpload((u) => (u ? { ...u, sent } : u)),
      });
      setDone((prev) => new Set(prev).add(student.id));
      setToast(`Copie de ${student.label} enregistrée (${pagesLabel(pages.length)}).`);
    } catch (e) {
      const reason = e instanceof Error ? e.message : "Erreur d'envoi.";
      setError(`La copie de ${student.label} n'a pas été enregistrée : ${reason}`);
    } finally {
      setUpload(null);
    }
  }

  if (active) {
    return <DocumentScanner studentLabel={active.label} onCancel={() => setActive(null)} onDone={(pages) => void send(active, pages)} />;
  }

  const count = done.size;
  const total = students.length;

  return (
    <div className="space-y-4">
      <header className="sticky top-0 z-10 -mx-4 space-y-2 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur">
        <h1 className="font-display text-xl font-medium tracking-tight">{title}</h1>
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-sage transition-all" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
          </div>
          <p className="shrink-0 text-sm text-ink-soft">
            {count} / {total} copie{total > 1 ? "s" : ""} scannée{count > 1 ? "s" : ""}
          </p>
        </div>
      </header>

      {upload && (
        <div role="status" className="rounded-xl border border-line bg-sheet px-4 py-3 text-sm">
          <p className="font-medium">
            Envoi de la copie de {upload.label} ({pagesLabel(upload.pages)})…
          </p>
          <p className="text-xs text-ink-mute">
            {upload.sent} / {upload.pages} envoyée{upload.sent > 1 ? "s" : ""}
          </p>
        </div>
      )}
      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl bg-pen-soft px-4 py-3 text-sm text-pen">
          <p>{error}</p>
          <button type="button" onClick={() => setError("")} aria-label="Fermer le message" className="shrink-0 font-semibold">
            ✕
          </button>
        </div>
      )}

      {total === 0 ? (
        <p className="text-sm text-ink-soft">Aucun élève dans cette classe.</p>
      ) : (
        <>
          <p className="text-sm text-ink-soft">Touchez un élève, puis cadrez chaque page de sa copie : la photo se prend toute seule.</p>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-sheet">
            {students.map((s) => {
              const scanned = done.has(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setActive(s)}
                    disabled={upload !== null}
                    className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-ink/5 disabled:opacity-50"
                  >
                    <span
                      aria-hidden
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${scanned ? "bg-sage-soft text-sage" : "border border-line-strong"}`}
                    >
                      {scanned ? "✓" : ""}
                    </span>
                    <span className={`flex-1 text-base ${scanned ? "text-ink-mute" : "font-medium text-ink"}`}>{s.label}</span>
                    <span className="text-xs text-ink-mute">{scanned ? "Refaire" : "Scanner"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-ink-mute">Évitez de photographier le nom de l&apos;élève : il n&apos;est pas utile à l&apos;analyse.</p>
        </>
      )}

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 rounded-xl bg-ink px-4 py-3 text-center text-sm text-sheet shadow-lg">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
