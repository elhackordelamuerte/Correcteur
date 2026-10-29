import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { requireRole } from "@/lib/auth";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("student");
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link href="/eleve" className="text-lg font-bold text-brand-700">Copia</Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">{profile.display_name}</span>
            <form action={signOut}><button className="text-slate-500 hover:text-slate-800">Déconnexion</button></form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}
