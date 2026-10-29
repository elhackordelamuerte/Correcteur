import { notFound } from "next/navigation";
import { Card, PageTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatPoints } from "@/lib/format";

type FinalResult = { criteria: { criterion_id: string; points: number; comment: string }[]; general_comment: string };

export default async function StudentCopyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole("student");
  // La RLS ne laisse passer que les copies publiées de l'élève
  const { data: copy } = await supabase.from("copies").select("score,final_result,evaluation_id,evaluations(title,total_points)").eq("id", id).single();
  if (!copy) notFound();
  const { data: criteria } = await supabase.from("criteria").select("id,label,points").eq("evaluation_id", copy.evaluation_id).order("position");
  const result = copy.final_result as FinalResult;
  const e = copy.evaluations as unknown as { title: string; total_points: number };
  const byId = new Map(result.criteria.map((c) => [c.criterion_id, c]));

  return (
    <>
      <PageTitle title={e.title} subtitle={`${formatPoints(copy.score)} / ${formatPoints(e.total_points)}`} back={{ href: "/eleve", label: "Accueil" }} />
      <div className="space-y-4">
        {result.general_comment && <Card><p className="text-slate-700">{result.general_comment}</p></Card>}
        {(criteria ?? []).map((c) => {
          const r = byId.get(c.id);
          return (
            <Card key={c.id}>
              <div className="flex justify-between gap-2 font-medium"><span>{c.label}</span><span>{formatPoints(r?.points ?? 0)} / {formatPoints(c.points)}</span></div>
              {r?.comment && <p className="mt-2 text-sm text-slate-600">{r.comment}</p>}
            </Card>
          );
        })}
      </div>
    </>
  );
}
