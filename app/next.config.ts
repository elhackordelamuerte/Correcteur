import type { NextConfig } from "next";

// En-têtes de sécurité (F-10.17) : HSTS, anti-clickjacking, pas de sniffing MIME
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Serveur de développement uniquement (ignoré en production / sur Vercel) : autorise 127.0.0.1
  // et les adresses du réseau local, pour tester la page de scan depuis un téléphone en Wi-Fi.
  // « * » remplace exactement un segment de l'adresse.
  allowedDevOrigins: [
    "127.0.0.1",
    "192.168.*.*",
    "10.*.*.*",
    ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`),
    "*.local",
  ],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Le service worker doit toujours être relu, pour que ses mises à jour s'appliquent
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
