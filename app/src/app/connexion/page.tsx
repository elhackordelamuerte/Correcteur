import Link from "next/link";
import { signIn } from "@/app/actions/auth";
import { ActionForm } from "@/components/action-form";
import { AuthShell } from "@/components/auth-shell";
import { Field, inputClass } from "@/components/ui";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suite?: string; inscrit?: string }> }) {
  const { suite, inscrit } = await searchParams;
  return (
    <AuthShell title="Connexion">
      {inscrit && (
        <p className="mb-6 rounded-xl border border-sage/30 bg-sage-soft p-4 text-sm text-sage" role="status">
          Compte créé ! Un e-mail de confirmation a été envoyé à <strong>{inscrit}</strong>. Cliquez sur le lien qu&apos;il contient, puis connectez-vous.
        </p>
      )}
      <ActionForm action={signIn} submitLabel="Se connecter" className="space-y-5">
        <input type="hidden" name="suite" value={suite ?? ""} />
        <Field label="Adresse e-mail"><input className={inputClass} type="email" name="email" required autoComplete="email" defaultValue={inscrit ?? ""} /></Field>
        <Field label="Mot de passe"><input className={inputClass} type="password" name="password" required autoComplete="current-password" /></Field>
      </ActionForm>
      <p className="mt-8 text-sm text-ink-soft">
        Pas encore de compte ? <Link className="font-medium text-ink underline decoration-pen decoration-2 underline-offset-4" href="/inscription">Essai gratuit</Link>
      </p>
    </AuthShell>
  );
}
