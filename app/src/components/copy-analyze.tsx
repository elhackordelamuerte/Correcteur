"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { runAnalysis } from "@/app/actions/copies";
import { Button, Cost } from "./ui";

// Lance l'analyse IA d'une seule copie depuis sa page (copie déposée, pas encore analysée)
export function CopyAnalyzeCard({ copyId, failed }: { copyId: string; failed?: boolean }) {
  const router = useRouter();
  const [running, setRunning] = useState<"quick" | "deep" | null>(null);
  const [error, setError] = useState("");

  async function start(mode: "quick" | "deep") {
    setRunning(mode);
    setError("");
    const result = await runAnalysis(copyId, mode);
    if (result.error) setError(result.error);
    setRunning(null);
    router.refresh();
  }

  return (
    <div className="mb-6 rounded-xl border border-ochre/30 bg-ochre-soft p-4">
      <p className="font-medium text-ochre">{failed ? "L'analyse précédente a échoué." : "Cette copie n'a pas encore été analysée."}</p>
      <p className="mt-1 text-sm text-ink-soft">
        Lancez l&apos;analyse pour obtenir une proposition de notes et de commentaires, puis vérifiez-la. Vous pouvez aussi corriger à la main ci-dessous.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => start("quick")} disabled={running !== null}>
          {running === "quick" ? "Analyse en cours…" : <>Analyse rapide <Cost credits={1} /></>}
        </Button>
        <Button variant="secondary" onClick={() => start("deep")} disabled={running !== null}>
          {running === "deep" ? "Analyse en cours…" : <>Approfondie (écriture difficile) <Cost credits={2} /></>}
        </Button>
      </div>
      {running && <p className="mt-2 text-xs text-ink-mute">Comptez 10 à 40 secondes. Ne fermez pas la page.</p>}
      {error && <p className="mt-2 text-sm text-pen">{error}</p>}
    </div>
  );
}
