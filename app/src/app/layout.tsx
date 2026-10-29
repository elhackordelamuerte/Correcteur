import type { Metadata, Viewport } from "next";
import { Fraunces, Geist_Mono, Instrument_Sans } from "next/font/google";
import { ServiceWorker } from "@/components/pwa";
import "./globals.css";

// Polices auto-hébergées par Next : aucune requête vers Google côté visiteur
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["SOFT", "opsz"], style: ["normal", "italic"] });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Copia — l'assistant de correction des enseignants",
  description: "Corrigez selon votre barème, validez, suivez les compétences et proposez des exercices ciblés.",
  applicationName: "Copia",
  // Installation sur Mac (« Ajouter au Dock ») et iPhone (« Sur l'écran d'accueil »)
  appleWebApp: { capable: true, title: "Copia", statusBarStyle: "default" },
};

// Couleur de la barre de titre de la fenêtre installée
export const viewport: Viewport = { themeColor: "#f7f4ee" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${instrument.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
