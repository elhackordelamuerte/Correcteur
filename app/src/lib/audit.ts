import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Journal d'audit des opérations sensibles : qui, quoi, quand (F-10.14)
export async function audit(supabase: SupabaseClient, actorId: string, action: string, target: string) {
  await supabase.from("audit_log").insert({ actor_id: actorId, action, target });
}
