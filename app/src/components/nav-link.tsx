"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({ href, children, exact = false }: { href: string; children: ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-ink/[0.06] font-medium text-ink" : "text-ink-soft hover:bg-ink/[0.04] hover:text-ink"
      }`}
    >
      {active && <span className="absolute left-0.5 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-pen" />}
      {children}
    </Link>
  );
}
