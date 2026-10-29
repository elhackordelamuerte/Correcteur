"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { fail, type ActionState } from "@/lib/action-state";
import { getRequestOrigin } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";

const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "8 caractères minimum"),
  display_name: z.string().trim().min(2).max(80),
  role: z.enum(["teacher", "student"]),
  code: z.string().trim().toUpperCase().regex(/^[A-Z2-9]{6}$/).optional().or(z.literal("")),
});

export async function signUp(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Le code classe d'un lien d'invitation est conservé jusqu'au premier passage dans l'espace élève
      data: { role: parsed.data.role, display_name: parsed.data.display_name, join_code: parsed.data.code || undefined },
      emailRedirectTo: `${await getRequestOrigin()}/auth/callback`,
    },
  });
  if (error) return fail("Inscription impossible : " + error.message);
  // Confirmation d'e-mail requise : retour à la connexion avec un message
  if (!data.session) redirect(`/connexion?inscrit=${encodeURIComponent(parsed.data.email)}`);
  redirect(parsed.data.role === "teacher" ? "/app" : "/eleve");
}

export async function signIn(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("suite") ?? "");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error?.code === "email_not_confirmed") return fail("Adresse non confirmée : cliquez sur le lien reçu par e-mail.");
  if (error || !data.user) return fail("Identifiants incorrects.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  const home = profile?.role === "student" ? "/eleve" : "/app";
  redirect(next.startsWith(home) ? next : home);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
