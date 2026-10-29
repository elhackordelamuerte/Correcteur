export function formatPoints(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "–";
  return Number(value).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "–";
  return new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Une erreur est survenue.";
}
