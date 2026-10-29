"use client";

import { useEffect, useState } from "react";

// Événement non standard de Chrome / Edge, absent des types DOM
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

// Enregistre le service worker (production uniquement, pour ne pas gêner le développement)
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}

// Bouton « Installer Copia » : visible seulement si le navigateur propose l'installation
export function InstallButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt) return null;

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  }

  return (
    <button
      onClick={install}
      className="flex w-full items-center gap-3 rounded-xl border border-dashed border-pen/50 px-3 py-2.5 text-left text-sm transition-colors hover:border-pen hover:bg-pen-soft"
    >
      <span aria-hidden className="text-lg text-pen">↓</span>
      <span>
        <span className="block font-medium">Installer Copia</span>
        <span className="block text-xs text-ink-mute">Une icône sur votre bureau</span>
      </span>
    </button>
  );
}
