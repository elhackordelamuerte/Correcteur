import { NextResponse } from "next/server";
import { providerOrder } from "@/lib/ai/providers";

// Sonde de déploiement : configuration présente, sans exposer aucune valeur
export function GET() {
  return NextResponse.json({
    ok: true,
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    aiProviders: providerOrder(),
  });
}
