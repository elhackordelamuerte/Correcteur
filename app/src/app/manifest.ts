import type { MetadataRoute } from "next";

// Fiche d'identité de l'application installable (PWA)
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Copia — assistant de correction",
    short_name: "Copia",
    description: "Corrigez selon votre barème, validez, suivez les compétences et proposez des exercices ciblés.",
    lang: "fr",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#f7f4ee",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
