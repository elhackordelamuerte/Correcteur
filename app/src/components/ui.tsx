import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Card({ title, actions, children, className = "" }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-sheet p-6 ${className}`}>
      {(title || actions) && (
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-display text-xl font-medium tracking-tight">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

const BUTTON_VARIANTS = {
  primary: "bg-ink text-sheet hover:bg-ink/85",
  pen: "bg-pen text-white hover:bg-pen/90",
  secondary: "border border-line-strong bg-sheet text-ink hover:border-ink",
  danger: "border border-pen/40 bg-sheet text-pen hover:bg-pen hover:text-white",
  ghost: "text-ink-soft hover:bg-ink/5 hover:text-ink",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export function buttonClass(variant: ButtonVariant = "primary") {
  return `inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${BUTTON_VARIANTS[variant]}`;
}

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={`${buttonClass(variant)} ${className}`} {...props} />;
}

export function LinkButton({ variant = "primary", className = "", ...props }: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={`${buttonClass(variant)} ${className}`} {...props} />;
}

export const inputClass =
  "w-full rounded-xl border border-line-strong bg-sheet px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-mute transition-colors focus:border-ink focus:outline-none";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-xs font-medium uppercase tracking-[0.08em] text-ink-mute">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-mute">{hint}</span>}
    </label>
  );
}

const BADGE_TONES = {
  slate: "bg-ink/5 text-ink-soft",
  blue: "bg-ink text-sheet",
  green: "bg-sage-soft text-sage",
  amber: "bg-ochre-soft text-ochre",
  red: "bg-pen-soft text-pen",
} as const;

export function Badge({ tone = "slate", children }: { tone?: keyof typeof BADGE_TONES; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_TONES[tone]}`}>{children}</span>;
}

// Coût affiché avant chaque action IA (F-09.1)
export function Cost({ credits }: { credits: number }) {
  return (
    <span className="rounded-full border border-current/25 px-2 py-0.5 font-mono text-[11px] opacity-80">
      {credits === 0 ? "offert" : `${credits} cr.`}
    </span>
  );
}

export function PageTitle({ title, subtitle, back, eyebrow }: { title: string; subtitle?: ReactNode; back?: { href: string; label: string }; eyebrow?: string }) {
  return (
    <div className="mb-10 animate-rise space-y-2">
      {back && (
        <Link href={back.href} className="text-sm text-ink-mute transition-colors hover:text-ink">
          ← {back.label}
        </Link>
      )}
      {eyebrow && <p className="text-xs font-medium uppercase tracking-[0.14em] text-pen">{eyebrow}</p>}
      <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">{title}</h1>
      {subtitle && <div className="text-ink-soft">{subtitle}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-mute">{children}</p>;
}

// Note entourée au stylo rouge : la signature visuelle de Copia
export function PenScore({ score, total, size = "md" }: { score: number | string | null; total: number | string; size?: "md" | "lg" }) {
  if (score === null || score === undefined) return <span className="text-ink-mute">–</span>;
  const fmt = (v: number | string) => Number(v).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  const big = size === "lg";
  return (
    <span className={`relative inline-flex items-baseline gap-0.5 px-3 py-1 font-display text-pen ${big ? "text-4xl" : "text-lg"}`}>
      <svg aria-hidden viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <path
          d="M8 26 C 6 10, 40 3, 62 5 C 88 7, 97 18, 93 31 C 89 45, 52 48, 30 45 C 12 43, 3 35, 9 22 C 13 14, 24 9, 36 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="font-semibold italic">{fmt(score)}</span>
      <span className={`${big ? "text-lg" : "text-xs"} text-pen/70`}>/{fmt(total)}</span>
    </span>
  );
}

// Code classe présenté comme un tampon encreur
export function Stamp({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block -rotate-2 rounded-md border-2 border-dashed border-pen px-3 py-1 font-mono text-2xl font-semibold tracking-[0.3em] text-pen">
      {children}
    </span>
  );
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div>
      <p className="font-display text-3xl font-medium">{value}</p>
      <p className="text-xs uppercase tracking-[0.1em] text-ink-mute">{label}</p>
    </div>
  );
}
