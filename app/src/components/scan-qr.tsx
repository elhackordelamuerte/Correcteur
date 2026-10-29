"use client";

import QRCode from "qrcode";
import { useState } from "react";
import { createScanSession } from "@/app/actions/copies";
import { Button } from "./ui";

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
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qr.image} alt="QR code de scan" width={160} height={160} className="rounded border" />
      <p className="text-sm text-slate-600">
        Scannez ce code avec l&apos;appareil photo de votre téléphone. Le lien est valable 2 heures.
        <br />
        <a href={qr.url} className="break-all text-brand-600" target="_blank" rel="noreferrer">{qr.url}</a>
      </p>
    </div>
  );
}
