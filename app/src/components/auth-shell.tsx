import type { ReactNode } from "react";
import { Logo } from "./logo";

// Mise en page partagée connexion / inscription : citation éditoriale + formulaire
export function AuthShell({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between border-r border-line p-12 lg:flex">
        <Logo />
        <blockquote className="max-w-md">
          <p className="font-display text-4xl leading-tight tracking-tight">
            Trente copies, un dimanche soir. <span className="italic text-pen">Plus maintenant.</span>
          </p>
          <p className="mt-6 text-ink-soft">
            {aside ?? "L'IA propose une correction critère par critère, selon votre barème. Vous gardez toujours le dernier mot."}
          </p>
        </blockquote>
        <p className="text-xs text-ink-mute">Aucun nom d&apos;élève transmis à l&apos;IA · Données hébergées dans l&apos;UE</p>
      </section>
      <section className="flex flex-col justify-center px-6 py-12 sm:px-16">
        <div className="mb-10 lg:hidden"><Logo /></div>
        <div className="w-full max-w-sm animate-rise">
          <h1 className="mb-8 font-display text-4xl font-medium tracking-tight">{title}</h1>
          {children}
        </div>
      </section>
    </main>
  );
}
