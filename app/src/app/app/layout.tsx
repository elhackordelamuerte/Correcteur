import { signOut } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { InstallButton } from "@/components/pwa";
import { requireRole } from "@/lib/auth";
import { getAccount } from "@/lib/credits";

const PLAN_LABELS: Record<string, string> = { trial: "Essai Expert", pro: "Pro", expert: "Expert", lapsed: "Lecture seule" };

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireRole("teacher");
  const [account, { data: classes }] = await Promise.all([
    getAccount(supabase, user.id),
    supabase.from("classes").select("id,name").order("created_at"),
  ]);
  const balance = (account?.included_balance ?? 0) + (account?.purchased_balance ?? 0);
  const quota = Math.max(account?.included_credits ?? 1, 1);
  const low = account ? balance < Math.max(10, quota * 0.1) : false;
  const ratio = Math.min(1, balance / quota);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[200px_1fr]">
      <aside className="no-print sticky top-0 hidden h-screen flex-col border-r border-line px-3.5 py-6 lg:flex">
        <Logo href="/app" />
        <nav className="mt-8 space-y-1">
          <NavLink href="/app" exact>Tableau de bord</NavLink>
        </nav>
        <p className="mb-2 mt-8 px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">Classes</p>
        <nav className="space-y-1 overflow-y-auto">
          {(classes ?? []).map((c) => (
            <NavLink key={c.id} href={`/app/classes/${c.id}`}>{c.name}</NavLink>
          ))}
          {(classes ?? []).length === 0 && <p className="px-3 text-sm text-ink-mute">Aucune classe</p>}
        </nav>
        <div className="mt-auto space-y-3">
          <InstallButton />
          <a href="/app/compte" className="block rounded-xl border border-line px-3.5 py-3 transition-colors hover:border-line-strong">
            <div className="flex items-baseline justify-between">
              <span className={`font-display text-xl ${low ? "text-pen" : ""}`}>{balance}</span>
              <span className="text-xs text-ink-mute">crédits</span>
            </div>
            {/* Jauge façon trait d'encre */}
            <div className="mt-2 h-1 rounded-full bg-line">
              <div className={`h-1 rounded-full ${low ? "bg-pen" : "bg-ink"}`} style={{ width: `${ratio * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink-mute">{PLAN_LABELS[account?.plan ?? "trial"]}</p>
          </a>
          <div className="flex items-center justify-between px-1 text-sm">
            <span className="truncate text-ink-soft">{profile.display_name}</span>
            <form action={signOut}><button className="text-ink-mute hover:text-pen">Sortir</button></form>
          </div>
        </div>
      </aside>

      <header className="no-print flex items-center justify-between border-b border-line px-4 py-3 lg:hidden">
        <Logo href="/app" />
        <a href="/app/compte" className={`rounded-full border border-line px-3 py-1 font-mono text-xs ${low ? "text-pen" : ""}`}>{balance} cr.</a>
      </header>
      <nav className="no-print flex gap-1 overflow-x-auto border-b border-line px-3 py-2 lg:hidden">
        <NavLink href="/app" exact>Accueil</NavLink>
        {(classes ?? []).map((c) => (
          <NavLink key={c.id} href={`/app/classes/${c.id}`}>{c.name}</NavLink>
        ))}
      </nav>

      <div>
        {low && (
          <p className="no-print border-b border-pen/20 bg-pen-soft px-6 py-2 text-sm text-pen">
            Vos crédits arrivent à épuisement. Tout le travail manuel reste disponible.
          </p>
        )}
        {account?.plan === "lapsed" && (
          <p className="no-print border-b border-pen/20 bg-pen-soft px-6 py-2 text-sm text-pen">
            Votre essai est terminé : vos données restent consultables, les actions IA sont désactivées.
          </p>
        )}
        {/* Les pages de travail à deux colonnes (data-wide) disposent de plus de largeur */}
        <main className="mx-auto max-w-5xl px-5 py-10 has-[[data-wide]]:max-w-[96rem] sm:px-10 sm:py-14 has-[[data-wide]]:lg:px-8 has-[[data-wide]]:lg:py-10">{children}</main>
      </div>
    </div>
  );
}
