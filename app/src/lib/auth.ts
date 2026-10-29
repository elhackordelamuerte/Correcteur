import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "teacher" | "student";

// Charge la session et le profil ; redirige si le rôle ne correspond pas
export async function requireRole(role: Role) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/connexion");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
  if (!profile) redirect("/connexion");
  if (profile.role !== role) redirect(profile.role === "teacher" ? "/app" : "/eleve");
  return { supabase, user: data.user, profile: profile as { id: string; role: Role; display_name: string } };
}
