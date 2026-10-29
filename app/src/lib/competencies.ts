import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { aggregateStatus, type CompetencyStatus } from "@/lib/rules";

export type CompetencyMap = {
  competencies: { id: string; label: string }[];
  // statut[studentId][competencyId]
  status: Record<string, Record<string, CompetencyStatus | null>>;
};

// Calcule les statuts à partir des observations validées (les plus récentes d'abord)
export async function loadCompetencyMap(supabase: SupabaseClient, studentIds: string[]): Promise<CompetencyMap> {
  if (studentIds.length === 0) return { competencies: [], status: {} };
  const { data: obs } = await supabase
    .from("competency_observations")
    .select("student_id, competency_id, ratio, created_at, competencies(id,label)")
    .in("student_id", studentIds)
    .order("created_at", { ascending: false });

  const competencies = new Map<string, string>();
  const ratios = new Map<string, number[]>();
  for (const o of obs ?? []) {
    const c = o.competencies as unknown as { id: string; label: string } | null;
    if (c) competencies.set(c.id, c.label);
    const key = `${o.student_id}:${o.competency_id}`;
    ratios.set(key, [...(ratios.get(key) ?? []), Number(o.ratio)]);
  }
  const status: CompetencyMap["status"] = {};
  for (const sid of studentIds) {
    status[sid] = {};
    for (const cid of competencies.keys()) status[sid][cid] = aggregateStatus(ratios.get(`${sid}:${cid}`) ?? []);
  }
  return {
    competencies: [...competencies].map(([id, label]) => ({ id, label })).sort((a, b) => a.label.localeCompare(b.label, "fr")),
    status,
  };
}
