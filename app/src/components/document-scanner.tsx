"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { coverTransform, fitWithin, isQuadStable, maxCornerShift, type Quad, quadTargetSize, scaleQuad } from "@/lib/scan/geometry";
import { type Cv, detectSheet, loadOpenCv, warpSheet } from "@/lib/scan/opencv";
import { canvasToJpeg, compressImage, MAX_COPY_PAGES, MAX_IMAGE_SIDE } from "@/lib/upload-copy";

const DETECT_INTERVAL_MS = 200;
const DETECT_WIDTH = 480; // image réduite pour la détection (rapide)
const STABLE_MS = 1000; // durée d'immobilité avant capture automatique
const STABLE_RATIO = 0.015; // tolérance de mouvement des coins (fraction de la diagonale)
const REARM_RATIO = 0.08; // déplacement nécessaire pour considérer une nouvelle page
const COOLDOWN_MS = 1500;
const FLASH_MS = 180;
// Identifiant local des pages : crypto.randomUUID n'existe qu'en contexte sécurisé (https), absent en http sur le réseau local
let pageSeq = 0;
const nextPageId = (): string => `page-${Date.now()}-${++pageSeq}`;

type Page = { id: string; blob: Blob; url: string };
type CameraState = { status: "starting" | "live" } | { status: "unavailable"; reason: string };
type CvState = "loading" | "ready" | "failed";
type Hint = "search" | "hold" | "next" | "full";

type Props = {
  studentLabel: string;
  maxPages?: number;
  onCancel: () => void;
  onDone: (pages: Blob[]) => void;
};

const HINTS: Record<Hint, string> = {
  search: "Cadrez la feuille entière sur un fond contrasté",
  hold: "Ne bougez plus…",
  next: "Page capturée — tournez la page",
  full: "Nombre maximal de pages atteint : terminez ou supprimez une page",
};

function cameraErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError") return "L'accès à l'appareil photo a été refusé. Autorisez-le dans les réglages du navigateur, ou ajoutez des photos ci-dessous.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Aucun appareil photo utilisable n'a été trouvé. Ajoutez des photos ci-dessous.";
  return "Impossible de démarrer l'appareil photo. Ajoutez des photos ci-dessous.";
}

// Dessine la feuille détectée par-dessus la vidéo (affichée en object-cover)
function drawOverlay(canvas: HTMLCanvasElement, video: HTMLVideoElement, quad: Quad | null, progress: number) {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.round(canvas.clientWidth * dpr);
  const height = Math.round(canvas.clientHeight * dpr);
  if (canvas.width !== width || canvas.height !== height) Object.assign(canvas, { width, height });
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  if (!quad || !video.videoWidth) return;
  const { scale, dx, dy } = coverTransform({ width: video.videoWidth, height: video.videoHeight }, { width, height });
  ctx.beginPath();
  quad.forEach((p, i) => (i === 0 ? ctx.moveTo : ctx.lineTo).call(ctx, p.x * scale + dx, p.y * scale + dy));
  ctx.closePath();
  const ready = progress >= 1;
  ctx.fillStyle = ready ? "rgba(79, 122, 90, 0.35)" : `rgba(255, 255, 255, ${0.12 + progress * 0.18})`;
  ctx.fill();
  ctx.lineWidth = 3 * dpr;
  ctx.strokeStyle = ready ? "#4f7a5a" : "#ffffff";
  ctx.stroke();
}

// Scanner de documents plein écran : détection de la feuille, capture automatique, redressement
export function DocumentScanner({ studentLabel, maxPages = MAX_COPY_PAGES, onCancel, onDone }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<Cv | null>(null);
  const pagesRef = useRef<Page[]>([]);
  const lastQuadRef = useRef<Quad | null>(null);
  const capturedQuadRef = useRef<Quad | null>(null);
  const stableSinceRef = useRef<number | null>(null);
  const armedRef = useRef(true);
  const cooldownUntilRef = useRef(0);
  const capturingRef = useRef(false);
  const hintRef = useRef<Hint>("search");

  const [camera, setCamera] = useState<CameraState>({ status: "starting" });
  const [cvState, setCvState] = useState<CvState>("loading");
  const [pages, setPages] = useState<Page[]>([]);
  const [hint, setHint] = useState<Hint>("search");
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  // Libère les aperçus à la fermeture du scanner
  useEffect(() => () => pagesRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const updateHint = useCallback((next: Hint) => {
    if (hintRef.current === next) return;
    hintRef.current = next;
    setHint(next);
  }, []);

  const addPage = useCallback(
    (blob: Blob) => {
      setPages((prev) => (prev.length >= maxPages ? prev : [...prev, { id: nextPageId(), blob, url: URL.createObjectURL(blob) }]));
    },
    [maxPages],
  );

  // Démarrage de la caméra arrière (contexte sécurisé obligatoire)
  useEffect(() => {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setCamera({
        status: "unavailable",
        reason: "L'appareil photo n'est accessible que via une connexion sécurisée (https). Vous pouvez quand même ajouter des photos ci-dessous.",
      });
      return;
    }
    let cancelled = false;
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 2560 }, height: { ideal: 1920 } } })
      .then((s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        const video = videoRef.current;
        if (video) {
          video.srcObject = s;
          video.play().catch(() => undefined);
        }
        setCamera({ status: "live" });
      })
      .catch((e: unknown) => {
        if (!cancelled) setCamera({ status: "unavailable", reason: cameraErrorMessage(e) });
      });
    const video = videoRef.current;
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      if (video) video.srcObject = null;
    };
  }, []);

  // Chargement d'OpenCV uniquement quand la caméra fonctionne
  useEffect(() => {
    if (camera.status !== "live") return;
    let active = true;
    loadOpenCv().then(
      (handle) => {
        if (!active) return;
        cvRef.current = handle.cv;
        setCvState("ready");
      },
      () => active && setCvState("failed"),
    );
    return () => {
      active = false;
    };
  }, [camera.status]);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || capturingRef.current || pagesRef.current.length >= maxPages) return;
    capturingRef.current = true;
    const frame = document.createElement("canvas");
    const output = document.createElement("canvas");
    try {
      frame.width = video.videoWidth;
      frame.height = video.videoHeight;
      const ctx = frame.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(video, 0, 0);
      const quad = lastQuadRef.current;
      const cv = cvRef.current;
      if (cv && quad) {
        warpSheet(cv, ctx.getImageData(0, 0, frame.width, frame.height), quad, quadTargetSize(quad, MAX_IMAGE_SIDE), output);
      } else {
        const size = fitWithin({ width: frame.width, height: frame.height }, MAX_IMAGE_SIDE);
        Object.assign(output, size);
        output.getContext("2d")?.drawImage(frame, 0, 0, size.width, size.height);
      }
      addPage(await canvasToJpeg(output));
      setFlash(true);
      window.setTimeout(() => setFlash(false), FLASH_MS);
      navigator.vibrate?.(30);
      capturedQuadRef.current = quad;
      armedRef.current = !quad;
      stableSinceRef.current = null;
      cooldownUntilRef.current = performance.now() + COOLDOWN_MS;
      setError("");
    } catch {
      setError("La capture a échoué, réessayez.");
    } finally {
      // Libère la mémoire des grands canvas (important sur iOS)
      frame.width = 0;
      output.width = 0;
      capturingRef.current = false;
    }
  }, [addPage, maxPages]);

  // Boucle de détection sur une image réduite
  useEffect(() => {
    if (camera.status !== "live") return;
    const proc = document.createElement("canvas");
    const procCtx = proc.getContext("2d", { willReadFrequently: true });
    let timer = 0;
    let stopped = false;

    const tick = () => {
      const video = videoRef.current;
      const overlay = overlayRef.current;
      const cv = cvRef.current;
      if (!video || !overlay || !procCtx || video.readyState < 2 || !video.videoWidth) return;
      const full = pagesRef.current.length >= maxPages;
      if (!cv || full) {
        lastQuadRef.current = null;
        drawOverlay(overlay, video, null, 0);
        updateHint(full ? "full" : "search");
        return;
      }
      const scale = Math.min(1, DETECT_WIDTH / video.videoWidth);
      proc.width = Math.round(video.videoWidth * scale);
      proc.height = Math.round(video.videoHeight * scale);
      procCtx.drawImage(video, 0, 0, proc.width, proc.height);
      const found = detectSheet(cv, procCtx.getImageData(0, 0, proc.width, proc.height));
      const quad = found ? scaleQuad(found, 1 / scale) : null;
      const diagonal = Math.hypot(video.videoWidth, video.videoHeight);
      const now = performance.now();

      if (!(quad && isQuadStable(lastQuadRef.current, quad, diagonal * STABLE_RATIO))) stableSinceRef.current = quad ? now : null;
      lastQuadRef.current = quad;
      // Réarmement : la feuille a disparu ou a nettement bougé depuis la dernière capture
      const captured = capturedQuadRef.current;
      if (!armedRef.current && (!quad || !captured || maxCornerShift(captured, quad) > diagonal * REARM_RATIO)) armedRef.current = true;

      const stableFor = stableSinceRef.current === null ? 0 : now - stableSinceRef.current;
      const armed = armedRef.current && now >= cooldownUntilRef.current;
      drawOverlay(overlay, video, quad, armed ? stableFor / STABLE_MS : 0);
      updateHint(!armedRef.current ? "next" : quad ? "hold" : "search");
      if (quad && armed && stableFor >= STABLE_MS) void capture();
    };

    const loop = () => {
      if (stopped) return;
      try {
        tick();
      } catch {
        // Une image ratée ne doit pas arrêter la boucle
      }
      timer = window.setTimeout(loop, DETECT_INTERVAL_MS);
    };
    loop();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      proc.width = 0;
    };
  }, [camera.status, capture, maxPages, updateHint]);

  async function importFiles(list: FileList | null) {
    const files = Array.from(list ?? []).slice(0, Math.max(0, maxPages - pagesRef.current.length));
    try {
      for (const file of files) addPage(await compressImage(file));
      setError("");
    } catch {
      setError("Une des photos n'a pas pu être lue.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function removePage(id: string) {
    setPages((prev) => {
      const page = prev.find((p) => p.id === id);
      if (page) URL.revokeObjectURL(page.url);
      return prev.filter((p) => p.id !== id);
    });
  }

  const full = pages.length >= maxPages;
  const live = camera.status !== "unavailable";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <header className="flex items-center justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onCancel} className="rounded-full px-3 py-2 text-sm font-medium hover:bg-white/10">
          Annuler
        </button>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold">{studentLabel}</p>
          <p className="text-xs text-white/60">
            {pages.length} / {maxPages} page{pages.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDone(pages.map((p) => p.blob))}
          disabled={pages.length === 0}
          className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-40"
        >
          Terminer ({pages.length})
        </button>
      </header>

      <div className="relative flex-1 overflow-hidden">
        {live ? (
          <>
            <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted autoPlay />
            <canvas ref={overlayRef} className="pointer-events-none absolute inset-0 h-full w-full" />
            <div className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-150 ${flash ? "opacity-80" : "opacity-0"}`} />
            <div className="absolute inset-x-0 top-3 flex flex-col items-center gap-2 px-4 text-center">
              {camera.status === "starting" && <Pill>Démarrage de l&apos;appareil photo…</Pill>}
              {camera.status === "live" && cvState === "loading" && <Pill>Chargement du scanner…</Pill>}
              {camera.status === "live" && cvState === "failed" && <Pill>Détection indisponible : capture manuelle, sans recadrage</Pill>}
              {camera.status === "live" && cvState === "ready" && <Pill>{HINTS[hint]}</Pill>}
              {camera.status === "live" && cvState !== "ready" && full && <Pill>{HINTS.full}</Pill>}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="max-w-sm text-sm text-white/80">{camera.reason}</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={full}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-40"
            >
              Ajouter des photos
            </button>
          </div>
        )}
        {error && <p className="absolute inset-x-4 bottom-3 rounded-xl bg-[#c8361d] px-3 py-2 text-center text-sm">{error}</p>}
      </div>

      <div className="space-y-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        {pages.length > 0 && (
          <ul className="flex gap-2 overflow-x-auto pb-1">
            {pages.map((p, i) => (
              <li key={p.id} className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Page ${i + 1}`} className="h-20 w-14 rounded-md border border-white/30 object-cover" />
                <span className="absolute bottom-0.5 left-1 text-[10px] font-semibold drop-shadow">{i + 1}</span>
                <button
                  type="button"
                  onClick={() => removePage(p.id)}
                  aria-label={`Supprimer la page ${i + 1}`}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-xs ring-1 ring-white/40"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-3 items-center">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={full} className="justify-self-start text-sm text-white/80 disabled:opacity-40">
            Importer
          </button>
          {camera.status === "live" ? (
            <button
              type="button"
              onClick={() => void capture()}
              disabled={full}
              aria-label="Prendre la page en photo"
              className="h-16 w-16 justify-self-center rounded-full border-4 border-white bg-white/20 active:bg-white/60 disabled:opacity-40"
            />
          ) : (
            <span />
          )}
          <span className="justify-self-end text-xs text-white/60">{full ? `${maxPages} pages max` : ""}</span>
        </div>
      </div>

      {/* Sans attribut capture : iOS propose alors photothèque ou appareil photo, en sélection multiple */}
      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void importFiles(e.target.files)} />
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium backdrop-blur">{children}</span>;
}
