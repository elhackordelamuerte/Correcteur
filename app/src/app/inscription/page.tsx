import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { ActionForm } from "@/components/action-form";
import { AuthShell } from "@/components/auth-shell";
import { Field, inputClass } from "@/components/ui";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ role?: string; code?: string }> }) {
  const { role, code } = await searchParams;
  const isStudent = role === "student";
  return (
    <AuthShell
      title={isStudent ? "Mon compte élève" : "14 jours pour essayer"}
      aside={isStudent ? "Retrouve tes copies corrigées, tes exercices et les conseils de ton prof, sur ton téléphone." : undefined}
    >
      {!isStudent && <p className="-mt-4 mb-8 text-sm text-ink-soft">Toutes les fonctions Expert et 250 crédits. Sans carte bancaire.</p>}
      {isStudent && code && (
        <p className="-mt-4 mb-8 text-sm text-ink-soft">
          Tu rejoindras la classe <span className="font-mono font-semibold tracking-widest text-pen">{code}</span> juste après.
        </p>
      )}
      <ActionForm action={signUp} submitLabel="Créer mon compte" className="space-y-5">
        <input type="hidden" name="role" value={isStudent ? "student" : "teacher"} />
        {isStudent && code && <input type="hidden" name="code" value={code} />}
        <Field label={isStudent ? "Prénom" : "Nom affiché"}><input className={inputClass} name="display_name" required minLength={2} /></Field>
        <Field label="Adresse e-mail"><input className={inputClass} type="email" name="email" required autoComplete="email" /></Field>
        <Field label="Mot de passe" hint="8 caractères minimum"><input className={inputClass} type="password" name="password" required minLength={8} autoComplete="new-password" /></Field>
      </ActionForm>
      <p className="mt-8 space-x-4 text-sm text-ink-soft">
        <Link className="hover:text-ink" href={isStudent ? "/inscription" : "/inscription?role=student"}>{isStudent ? "Je suis enseignant·e" : "Je suis élève"}</Link>
        <Link className="hover:text-ink" href="/connexion">J&apos;ai déjà un compte</Link>
      </p>
    </AuthShell>
  );
}
