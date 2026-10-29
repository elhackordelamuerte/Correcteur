"use client";

import QRCode from "qrcode";
import { useState } from "react";
import { createScanSession } from "@/app/actions/copies";
import { Button } from "./ui";

// Un téléphone ne peut pas ouvrir « localhost » : cela désignerait le téléphone lui-même
function isLoopbackUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname.endsWith(".localhost");
  } catch {
    return false;
  }
}

// QR code à scanner avec le téléphone : aucune application, aucune connexion (ADR-012)
export function ScanQr({ evaluationId, siteUrl }: { evaluationId: string; siteUrl: string }) {
  const [qr, setQr] = useState<{ url: string; image: string } | null>(null);
  const [error, setError] = useState("");

  async function open() {
    const session = await createScanSession(evaluationId);
    if (!session.token) return setError(session.error ?? "Erreur");
    const url = `${siteUrl}/scan/${session.token}`;
    setQr({ url, image: await QRCode.toDataURL(url, { width: 240, margin: 1 }) });
  }

  if (!qr) {
    return (
      <div className="space-y-2">
        <Button variant="secondary" onClick={open}>📱 Scanner avec mon téléphone</Button>
        {error && <p className="text-sm text-pen">{error}</p>}
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {isLoopbackUrl(qr.url) && (
        <p role="alert" className="rounded-xl bg-pen-soft px-3 py-2 text-sm text-pen">
          Ce lien pointe vers « localhost » : votre téléphone ne pourra pas l&apos;ouvrir. En développement, lancez{" "}
          <code className="font-mono">npm run dev:lan</code> et ouvrez le site depuis l&apos;adresse réseau du Mac
          (<code className="font-mono">https://&lt;IP-du-Mac&gt;:3000</code>) : le QR code reprendra cette adresse.
        </p>
      )}
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr.image} alt="QR code de scan" width={160} height={160} className="rounded border" />
        <p className="text-sm text-ink-soft">
          Scannez ce code avec l&apos;appareil photo de votre téléphone. Le lien est valable 2 heures.
          <br />
          <a href={qr.url} className="break-all text-pen" target="_blank" rel="noreferrer">{qr.url}</a>
        </p>
      </div>
    </div>
  );
}
