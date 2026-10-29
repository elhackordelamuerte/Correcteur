import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CREDIT_COSTS, type CreditAction } from "@/lib/rules";

export class CreditError extends Error {}

// Débite à l'engagement, exécute, restitue si l'action échoue (F-09.2)
export async function withCredits<T>(
  supabase: SupabaseClient,
  action: CreditAction,
  reason: string,
  run: () => Promise<T>,
): Promise<T> {
  const amount = CREDIT_COSTS[action];
  const ref = crypto.randomUUID();
  if (amount > 0) {
    const { error } = await supabase.rpc("consume_credits", { p_amount: amount, p_reason: reason, p_ref: ref });
    if (error) throw new CreditError(error.message);
  }
  try {
    return await run();
  } catch (error) {
    if (amount > 0) {
      await supabase.rpc("refund_credits", { p_amount: amount, p_reason: reason, p_ref: ref });
    }
    throw error;
  }
}

export async function getAccount(supabase: SupabaseClient, teacherId: string) {
  const { data } = await supabase.from("teacher_accounts").select("*").eq("teacher_id", teacherId).single();
  return data as {
    plan: "trial" | "pro" | "expert" | "lapsed";
    trial_ends_at: string;
    period_start: string;
    included_credits: number;
    included_balance: number;
    purchased_balance: number;
  } | null;
}

// Fonctions Expert : carte des compétences et suivi dans le temps (essai inclus)
export function hasExpertFeatures(plan: string | undefined): boolean {
  return plan === "expert" || plan === "trial";
}
