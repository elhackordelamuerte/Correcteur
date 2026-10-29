import { signOut } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { requireRole } from "@/lib/auth";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireRole("student");
  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <Logo href="/eleve" />
          <form action={signOut}><button className="text-sm text-ink-mute hover:text-pen">Sortir</button></form>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-8">{children}</main>
    </div>
  );
}
