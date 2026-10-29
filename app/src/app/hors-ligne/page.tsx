import { Logo } from "@/components/logo";

export const dynamic = "force-static";

// Affichée par le service worker quand le réseau est coupé
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo />
      <h1 className="mt-10 font-display text-4xl font-medium tracking-tight">Pas de connexion Internet.</h1>
      <p className="mt-4 max-w-md text-ink-soft">
        Copia a besoin d&apos;Internet pour afficher vos classes et corriger les copies. Vérifiez le Wi-Fi ou le câble réseau, puis réessayez.
      </p>
      {/* Lien simple (pas de JavaScript requis) : recharge la dernière page demandée */}
      <a href="/app" className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-medium text-sheet">
        Réessayer
      </a>
    </main>
  );
}
