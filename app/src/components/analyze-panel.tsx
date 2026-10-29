"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { runAnalysis } from "@/app/actions/copies";
import { Button, Cost } from "./ui";

const CONCURRENCY = 3;

// Analyse en lot, une copie par appel serveur (chaque appel reste sous la limite de durée Vercel)
export function AnalyzePanel({ copyIds }: { copyIds: string[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"quick" | "deep">("quick");
  const [progress, setProgress] = useState<{ done: number; failed: number } | null>(null);
  const [lastError, setLastError] = useState("");
  const running = progress !== null && progress.done + progress.failed < copyIds.length;

  async function start() {
    if (!window.confirm(`Analyser ${copyIds.length} copie(s) pour ${copyIds.length * (mode === "deep" ? 2 : 1)} crédit(s) ?`)) return;
    setProgress({ done: 0, failed: 0 });
    setLastError("");
    const queue = [...copyIds];
    const worker = async () => {
      for (let id = queue.shift(); id; id = queue.shift()) {
        const result = await runAnalysis(id, mode);
        if (result.error) setLastError(result.error);
        setProgress((p) => p && (result.error ? { ...p, failed: p.failed + 1 } : { ...p, done: p.done + 1 }));
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, copyIds.length) }, worker));
    router.refresh();
  }

  if (copyIds.length === 0) return <p className="text-sm text-slate-500">Aucune copie en attente d&apos;analyse.</p>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" checked={mode === "quick"} onChange={() => setMode("quick")} disabled={running} /> Analyse rapide <Cost credits={1} />
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={mode === "deep"} onChange={() => setMode("deep")} disabled={running} /> Approfondie (transcription + analyse) <Cost credits={2} />
        </label>
      </div>
      <Button onClick={start} disabled={running}>
        {running ? "Analyse en cours…" : `Analyser ${copyIds.length} copie(s)`}
      </Button>
      {progress && (
        <p className="text-sm text-slate-600">
          {progress.done} analysée(s){progress.failed > 0 && `, ${progress.failed} en échec (crédits restitués)`} sur {copyIds.length}.
        </p>
      )}
      {lastError && <p className="text-sm text-red-700">{lastError}</p>}
    </div>
  );
}
