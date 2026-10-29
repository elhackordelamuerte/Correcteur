import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { requireEnv, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

// Client lié à la session : toutes les requêtes passent par la RLS
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component : le proxy se charge du rafraîchissement
        }
      },
    },
  });
}

// Client service : contourne la RLS. Réservé au flux de scan sans compte (ADR-012)
// et au téléchargement des copies pour l'analyse. Ne jamais l'exposer au client.
export function createAdminClient() {
  return createSupabaseClient(SUPABASE_URL, requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
