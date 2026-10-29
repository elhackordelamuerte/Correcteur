import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Copia — l'assistant de correction des enseignants",
  description: "Corrigez selon votre barème, validez, suivez les compétences et proposez des exercices ciblés.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
