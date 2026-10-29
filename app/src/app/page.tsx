import { LinkButton } from "@/components/ui";

const STEPS = [
  ["Créez l'évaluation", "Énoncé et barème générés ou saisis. Le barème est figé avant la correction."],
  ["Collectez les copies", "Photographiez la pile avec votre téléphone via un QR code, ou déposez des PDF."],
  ["L'IA propose", "Analyse rapide ou approfondie, critère par critère, selon votre barème."],
  ["Vous validez", "Rien n'est visible par l'élève tant que vous n'avez pas validé et publié."],
  ["Suivez les compétences", "À besoins, fragile, satisfaisante : la carte de la classe se met à jour."],
  ["Remédiez", "Exercices ciblés avec deux indices, assignés aux élèves qui en ont besoin."],
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="flex items-center justify-between">
        <span className="text-xl font-bold text-brand-700">Copia</span>
        <nav className="flex gap-2">
          <LinkButton href="/connexion" variant="secondary">Connexion</LinkButton>
          <LinkButton href="/inscription">Essai gratuit 14 jours</LinkButton>
        </nav>
      </header>
      <section className="py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">L&apos;IA propose, vous validez.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Correction de copies selon votre barème, suivi des compétences, exercices de remédiation, sujets adaptés DYS et
          appréciations de bulletin — pour les enseignants du secondaire.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <LinkButton href="/inscription">Démarrer mes 14 jours gratuits</LinkButton>
          <LinkButton href="/inscription?role=student" variant="secondary">Je suis élève</LinkButton>
        </div>
      </section>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map(([title, text], i) => (
          <li key={title} className="rounded-xl border border-slate-200 bg-white p-5">
            <span className="text-sm font-semibold text-brand-600">Étape {i + 1}</span>
            <h2 className="mt-1 font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{text}</p>
          </li>
        ))}
      </ol>
      <footer className="mt-16 text-center text-xs text-slate-500">
        Aucun nom d&apos;élève n&apos;est transmis à l&apos;IA. Les copies ne servent jamais à entraîner un modèle.
      </footer>
    </main>
  );
}
