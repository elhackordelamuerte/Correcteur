import "server-only";
import { headers } from "next/headers";
import { SITE_URL } from "@/lib/env";

// Origine réellement utilisée par le visiteur (domaine de prod, preview Vercel, domaine perso…) :
// les liens et QR codes générés pointent ainsi vers le site consulté, sans configuration
export async function getRequestOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return SITE_URL;
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  const proto = headerList.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  return `${proto.split(",")[0].trim()}://${host}`;
}
