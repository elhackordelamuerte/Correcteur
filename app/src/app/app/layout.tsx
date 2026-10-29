import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth";
import { getAccount } from "@/lib/credits";

const PLAN_LABELS: Record<string, string> = { trial: "Essai", pro: "Pro", expert: "Expert", lapsed: "Lecture seule" };

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireRole("teacher");
  const account = await getAccount(supabase, user.id);
  const balance = (account?.included_balance ?? 0) + (account?.purchased_balance ?? 0);
  const low = account ? balance < Math.max(10, account.included_credits * 0.1) : false;
  return (
    <div className="min-h-screen">
      <header className="no-print border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/app" className="text-lg font-bold text-brand-700">Copia</Link>
            <Link href="/app" className="hover:text-brand-600">Mes classes</Link>
            <Link href="/app/compte" className="hover:text-brand-600">Compte & crédits</Link>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/app/compte" className={`rounded-full px-3 py-1 font-medium ${low ? "bg-amber-100 text-amber-800" : "bg-brand-50 text-brand-700"}`}>
              {balance} crédits · {PLAN_LABELS[account?.plan ?? "trial"]}
            </Link>
            <span className="hidden text-slate-500 sm:inline">{profile.display_name}</span>
            <form action={signOut}><button className="text-slate-500 hover:text-slate-800">Déconnexion</button></form>
          </div>
        </div>
        {low && (
          <p className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
            Vos crédits arrivent à épuisement. Tout le travail manuel reste disponible.
          </p>
        )}
        {account?.plan === "lapsed" && (
          <p className="bg-red-50 px-4 py-2 text-center text-sm text-red-800">Votre essai est terminé : vos données restent consultables, les actions IA sont désactivées.</p>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
