"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { fail, ok, type ActionState } from "@/lib/action-state";
import { SITE_URL } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "8 caractères minimum"),
  display_name: z.string().trim().min(2).max(80),
  role: z.enum(["teacher", "student"]),
});

export async function signUp(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { role: parsed.data.role, display_name: parsed.data.display_name },
      emailRedirectTo: `${SITE_URL}/auth/callback`,
    },
  });
  if (error) return fail("Inscription impossible : " + error.message);
  if (!data.session) return ok("Vérifiez votre boîte mail pour confirmer votre adresse.");
  redirect(parsed.data.role === "teacher" ? "/app" : "/eleve");
}

export async function signIn(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("suite") ?? "");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
