import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { ActionForm } from "@/components/action-form";
import { Card, Field, inputClass } from "@/components/ui";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Link href="/" className="text-xl font-bold text-brand-700">Copia</Link>
      <Card title="Connexion" className="mt-6">
        <ActionForm action={signIn} submitLabel="Se connecter">
          <input type="hidden" name="suite" value={suite ?? ""} />
          <Field label="Adresse e-mail"><input className={inputClass} type="email" name="email" required autoComplete="email" /></Field>
          <Field label="Mot de passe"><input className={inputClass} type="password" name="password" required autoComplete="current-password" /></Field>
        </ActionForm>
        <p className="mt-4 text-sm text-slate-600">
          Pas encore de compte ? <Link className="text-brand-600 hover:underline" href="/inscription">Créer un compte</Link>
        </p>
      </Card>
    </main>
  );
}
