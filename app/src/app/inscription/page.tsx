import Link from "next/link";
import { signUp } from "@/app/actions/auth";
import { ActionForm } from "@/components/action-form";
import { Card, Field, inputClass } from "@/components/ui";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  const isStudent = role === "student";
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Link href="/" className="text-xl font-bold text-brand-700">Copia</Link>
      <Card title={isStudent ? "Créer mon compte élève" : "Démarrer l'essai gratuit"} className="mt-6">
        {!isStudent && (
          <p className="mb-4 text-sm text-slate-600">14 jours avec toutes les fonctions Expert et 250 crédits. Sans carte bancaire pendant le MVP.</p>
        )}
        <ActionForm action={signUp} submitLabel="Créer mon compte">
          <input type="hidden" name="role" value={isStudent ? "student" : "teacher"} />
          <Field label={isStudent ? "Prénom" : "Nom affiché"}><input className={inputClass} name="display_name" required minLength={2} /></Field>
          <Field label="Adresse e-mail"><input className={inputClass} type="email" name="email" required autoComplete="email" /></Field>
          <Field label="Mot de passe" hint="8 caractères minimum"><input className={inputClass} type="password" name="password" required minLength={8} autoComplete="new-password" /></Field>
        </ActionForm>
        <p className="mt-4 text-sm text-slate-600">
          {isStudent ? (
            <Link className="text-brand-600 hover:underline" href="/inscription">Je suis enseignant·e</Link>
          ) : (
            <Link className="text-brand-600 hover:underline" href="/inscription?role=student">Je suis élève</Link>
          )}
          {" · "}
          <Link className="text-brand-600 hover:underline" href="/connexion">J&apos;ai déjà un compte</Link>
        </p>
      </Card>
    </main>
  );
}
