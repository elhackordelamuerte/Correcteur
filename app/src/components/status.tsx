import { STATUS_LABELS, type CompetencyStatus } from "@/lib/rules";
import { Badge } from "./ui";

const COPY_STATUS: Record<string, { label: string; tone: "slate" | "blue" | "green" | "amber" | "red" }> = {
  uploaded: { label: "Déposée", tone: "slate" },
  analyzing: { label: "Analyse…", tone: "blue" },
  proposed: { label: "À valider", tone: "amber" },
  validated: { label: "Validée", tone: "green" },
  published: { label: "Publiée", tone: "green" },
  error: { label: "Erreur", tone: "red" },
};

export function CopyStatus({ status }: { status: string }) {
  const s = COPY_STATUS[status] ?? { label: status, tone: "slate" as const };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

const COMPETENCY_TONES: Record<CompetencyStatus, "red" | "amber" | "green"> = {
  besoin: "red",
  fragile: "amber",
  satisfaisante: "green",
};

export function CompetencyBadge({ status }: { status: CompetencyStatus | null }) {
  if (!status) return <Badge>Non observée</Badge>;
  return <Badge tone={COMPETENCY_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
