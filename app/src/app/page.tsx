import { Logo } from "@/components/logo";
import { LinkButton, PenScore } from "@/components/ui";

const STEPS = [
  ["Le barème d'abord", "Généré ou saisi, il est figé avant la correction. L'IA corrige selon vos critères, pas les siens."],
  ["La pile, photographiée", "Un QR code, l'appareil photo du téléphone, et chaque copie rejoint son élève."],
  ["Une proposition, critère par critère", "Analyse rapide ou approfondie, avec une justification pour chaque point."],
  ["Votre validation", "Rien n'est visible par l'élève tant que vous n'avez pas validé puis publié."],
  ["Les compétences, en clair", "À besoins, fragile, satisfaisante : la carte de la classe se dessine toute seule."],
  ["La remédiation, ciblée", "Un exercice, deux indices, assigné à ceux qui en ont besoin."],
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6">
      <header className="flex items-center justify-between py-7">
        <Logo />
        <nav className="flex items-center gap-2">
          <LinkButton href="/connexion" variant="ghost">Connexion</LinkButton>
          <LinkButton href="/inscription">Essai gratuit</LinkButton>
        </nav>
      </header>

      <section className="grid items-center gap-16 py-20 lg:grid-cols-[1.4fr_1fr] lg:py-28">
        <div className="animate-rise">
          <p className="mb-6 text-xs font-medium uppercase tracking-[0.16em] text-pen">Assistant de correction · 6e → Terminale</p>
          <h1 className="font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-7xl">
            L&apos;IA propose.
            <br />
            <span className="relative italic">
              Vous validez.
              <svg aria-hidden viewBox="0 0 300 20" preserveAspectRatio="none" className="absolute -bottom-3 left-0 h-4 w-full text-pen">
                <path d="M3 14 C 60 4, 140 4, 297 10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="mt-10 max-w-xl text-lg text-ink-soft">
            Correction selon votre barème, suivi des compétences, exercices de remédiation, sujets adaptés DYS et appréciations de bulletin.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <LinkButton href="/inscription" variant="pen" className="px-6 py-3 text-base">Démarrer mes 14 jours</LinkButton>
            <LinkButton href="/inscription?role=student" variant="secondary" className="px-6 py-3 text-base">Je suis élève</LinkButton>
          </div>
        </div>

        {/* Fragment de copie corrigée : la promesse en une image */}
        <figure className="relative mx-auto w-full max-w-sm rotate-[1.5deg] rounded-sm border border-line bg-sheet p-7 shadow-[0_30px_60px_-30px_rgb(28_26_23/0.35)]">
          <div className="absolute inset-y-0 left-10 w-px bg-pen/25" />
          <p className="pl-8 font-display text-lg italic">Exercice 2 — Pythagore</p>
          <div className="mt-4 space-y-3 pl-8 text-sm text-ink-soft">
            <p>AB² = AC² + BC² = 9 + 16 = 25</p>
            <p>donc AB = 5 cm <span className="ml-1 font-display italic text-pen">✓ bien justifié</span></p>
            <p className="decoration-pen decoration-wavy underline-offset-4 [text-decoration-line:underline]">Le triangle est rectangle en A.</p>
            <p className="font-display text-sm italic text-pen">→ préciser l&apos;angle droit : en C</p>
          </div>
          <div className="mt-6 flex justify-end">
            <PenScore score={3.5} total={4} size="lg" />
          </div>
        </figure>
      </section>

      <section className="border-t border-line py-20">
        <ol className="grid gap-x-12 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(([title, text], i) => (
            <li key={title}>
              <span className="font-display text-5xl italic text-pen/80">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="mt-3 font-display text-xl">{title}</h2>
              <p className="mt-2 text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="flex flex-wrap justify-between gap-4 border-t border-line py-8 text-xs text-ink-mute">
        <span>Aucun nom d&apos;élève n&apos;est transmis à l&apos;IA. Les copies ne servent jamais à entraîner un modèle.</span>
        <span>Données hébergées dans l&apos;Union européenne</span>
      </footer>
    </main>
  );
}
