// Règles métier pures (sans IA ni base), couvertes par les tests unitaires

// Grille des crédits (PRD-09)
export const CREDIT_COSTS = {
  copyQuick: 1,
  copyDeep: 2,
  rubric: 0,
  evaluation: 2,
  exercise: 1,
  exerciseCorrection: 1,
  variant: 2,
  appreciation: 1,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

const POINT_STEP = 0.5;

// Arrondit au demi-point le plus proche
export function roundToStep(value: number): number {
  return Math.round(value / POINT_STEP) * POINT_STEP;
}

// Le logiciel garantit que le barème tombe exactement sur le total (ADR-006)
export function balanceRubric(points: number[], total: number): number[] {
  if (points.length === 0) return [];
  const sum = points.reduce((a, b) => a + b, 0);
  const scaled = points.map((p) => Math.max(POINT_STEP, roundToStep(sum > 0 ? (p / sum) * total : total / points.length)));
  const drift = roundToStep(total - scaled.reduce((a, b) => a + b, 0));
  if (drift === 0) return scaled;
  // Corrige l'écart sur le critère le plus lourd pour limiter la distorsion relative
  const heaviest = scaled.indexOf(Math.max(...scaled));
  return scaled.map((p, i) => (i === heaviest ? Math.max(POINT_STEP, p + drift) : p));
}

export function rubricTotal(points: number[]): number {
  return roundToStep(points.reduce((a, b) => a + b, 0));
}

// Statuts de compétence en 3 niveaux (ADR-013)
export type CompetencyStatus = "besoin" | "fragile" | "satisfaisante";

const NEED_THRESHOLD = 0.4;
const FRAGILE_THRESHOLD = 0.7;
const RECENT_OBSERVATIONS = 3;

export function statusFromRatio(ratio: number): CompetencyStatus {
  if (ratio < NEED_THRESHOLD) return "besoin";
  if (ratio < FRAGILE_THRESHOLD) return "fragile";
  return "satisfaisante";
}

// Moyenne des dernières observations (les plus récentes en premier)
export function aggregateStatus(ratiosNewestFirst: number[]): CompetencyStatus | null {
  const recent = ratiosNewestFirst.slice(0, RECENT_OBSERVATIONS);
  if (recent.length === 0) return null;
  return statusFromRatio(recent.reduce((a, b) => a + b, 0) / recent.length);
}

export const STATUS_LABELS: Record<CompetencyStatus, string> = {
  besoin: "À besoins",
  fragile: "Fragile",
  satisfaisante: "Satisfaisante",
};

// Masque tout nom d'élève qui aurait fuité dans une sortie IA (ADR-004)
export function scrubNames(text: string, names: string[]): string {
  return names
    .map((n) => n.trim())
    .filter((n) => n.length >= 2)
    .reduce((acc, name) => {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return acc.replace(new RegExp(`\\b${escaped}\\b`, "giu"), "[élève]");
    }, text);
}

// Code classe à 6 caractères sans ambiguïté visuelle (pas de 0/O, 1/I) (ADR-014)
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinCode(random: (n: number) => number[] = cryptoRandom): string {
  return random(6).map((n) => CODE_ALPHABET[n % CODE_ALPHABET.length]).join("");
}

function cryptoRandom(n: number): number[] {
  return Array.from(crypto.getRandomValues(new Uint8Array(n)));
}

export const DYS_NEEDS = [
  "dyslexie",
  "dysorthographie",
  "dysgraphie",
  "dyspraxie",
  "dyscalculie",
  "dysphasie",
  "TDAH",
  "TSA",
] as const;

export const INTENSITY_LABELS: Record<number, string> = {
  1: "Mise en page pensée pour la lecture",
  2: "Étayage modéré des consignes et de la production",
  3: "Accompagnement maximal",
};
