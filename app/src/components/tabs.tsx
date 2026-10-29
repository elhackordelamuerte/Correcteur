"use client";

import { type ReactNode, useId, useState } from "react";

type Tab = { id: string; label: ReactNode; count?: string; content: ReactNode };

// Onglets accessibles (flèches gauche/droite au clavier) ; le contenu est rendu côté serveur
export function Tabs({ tabs, defaultTab }: { tabs: Tab[]; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  const baseId = useId();

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = tabs[(index + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    setActive(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  }

  return (
    <div className="@container">
      {/* Sélecteur à parts égales, façon intercalaire */}
      <div role="tablist" className="mb-6 grid gap-1 rounded-full border border-line bg-paper p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((t, i) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              id={`${baseId}-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`flex items-center justify-center gap-2 truncate rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                selected ? "bg-sheet text-ink shadow-[0_1px_3px_rgb(28_26_23/0.12)]" : "text-ink-mute hover:text-ink"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${selected ? "bg-pen-soft text-pen" : "bg-line/60 text-ink-mute"}`}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div key={t.id} id={`${baseId}-panel-${t.id}`} role="tabpanel" aria-labelledby={`${baseId}-tab-${t.id}`} hidden={t.id !== active}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
