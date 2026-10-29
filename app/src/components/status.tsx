import { STATUS_LABELS, type CompetencyStatus } from "@/lib/rules";
import { Badge } from "./ui";

const COPY_STATUS: Record<string, { label: string; tone: "slate" | "blue" | "green" | "amber" | "red" }> = {
  uploaded: { label: "Déposée", tone: "slate" },
  analyzing: { label: "Analyse…", tone: "slate" },
  proposed: { label: "À valider", tone: "amber" },
  validated: { label: "Validée", tone: "green" },
  published: { label: "Publiée", tone: "blue" },
  error: { label: "Erreur", tone: "red" },
};

export function CopyStatus({ status }: { status: string }) {
  const s = COPY_STATUS[status] ?? { label: status, tone: "slate" as const };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

const COMPETENCY_STYLE: Record<CompetencyStatus, string> = {
  besoin: "bg-pen",
  fragile: "bg-ochre",
  satisfaisante: "bg-sage",
};

// Pastille + libellé : lisible sans dépendre uniquement de la couleur
export function CompetencyBadge({ status, compact = false }: { status: CompetencyStatus | null; compact?: boolean }) {
  if (!status) return <span className="text-xs text-ink-mute">{compact ? "·" : "Non observée"}</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft" title={STATUS_LABELS[status]}>
      <span className={`h-2.5 w-2.5 rounded-full ${COMPETENCY_STYLE[status]}`} />
      {!compact && STATUS_LABELS[status]}
    </span>
  );
}
