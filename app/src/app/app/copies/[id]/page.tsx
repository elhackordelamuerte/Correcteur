import { notFound } from "next/navigation";
import { validateCopy } from "@/app/actions/copies";
import { ActionForm } from "@/components/action-form";
import { CopyStatus } from "@/components/status";
import { Badge, Card, Field, inputClass, PageTitle, PenScore } from "@/components/ui";
import type { CopyAnalysis } from "@/lib/ai/schemas";
import { requireRole } from "@/lib/auth";
import { formatPoints } from "@/lib/format";
import { signedUrls } from "@/lib/storage";

type FinalResult = { criteria: { criterion_id: string; points: number; comment: string }[]; general_comment: string };

export default async function CopyReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole("teacher");
  const { data: copy } = await supabase.from("copies").select("*, students(first_name,last_name), evaluations(id,title,total_points)").eq("id", id).single();
  if (!copy) notFound();
  const { data: criteria } = await supabase.from("criteria").select("id,label,expected,points").eq("evaluation_id", copy.evaluation_id).order("position");
  const urls = await signedUrls(supabase, copy.file_paths);
  const source = (copy.final_result ?? copy.ai_result) as (FinalResult & Partial<CopyAnalysis>) | null;
  const byId = new Map((source?.criteria ?? []).map((c) => [c.criterion_id, c]));
  const student = copy.students as { first_name: string; last_name: string };
  const evaluation = copy.evaluations as { id: string; title: string; total_points: number };
  const locked = copy.status === "published";

  return (
    <>
      <PageTitle
        title={`${student.first_name} ${student.last_name}`}
        subtitle={<>{evaluation.title} · <CopyStatus status={copy.status} /> {copy.ai_result?.confidence && <Badge tone="blue">Confiance IA : {copy.ai_result.confidence}</Badge>}</>}
        back={{ href: `/app/evaluations/${evaluation.id}`, label: evaluation.title }}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Copie">
          <div className="space-y-3">
            {urls.map((url, i) =>
              copy.file_paths[i]?.endsWith(".pdf") ? (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="text-pen underline">Ouvrir le PDF (page {i + 1})</a>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt={`Page ${i + 1}`} className="w-full rounded border" />
              ),
            )}
          </div>
          {copy.transcription && (
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer text-ink-soft">Transcription (analyse approfondie)</summary>
              <p className="prose-copia mt-2">{copy.transcription}</p>
            </details>
          )}
        </Card>
        <Card title={copy.status === "proposed" ? "Proposition de l'IA — à vérifier" : "Correction"}>
          {copy.status === "error" && <p className="mb-4 rounded bg-pen-soft p-3 text-sm text-pen">Analyse impossible ({copy.error}). Vous pouvez corriger à la main ci-dessous.</p>}
          <ActionForm action={validateCopy.bind(null, id)} submitLabel={copy.status === "validated" ? "Mettre à jour" : "Valider la correction"}>
            {(criteria ?? []).map((c) => {
              const r = byId.get(c.id);
              return (
                <div key={c.id} className="space-y-2 rounded-lg border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{c.label}</p>
                    <span className="flex items-center gap-1 text-sm">
                      <input className={`${inputClass} w-20`} name={`points_${c.id}`} defaultValue={r?.points ?? ""} inputMode="decimal" disabled={locked} /> / {formatPoints(c.points)}
                    </span>
                  </div>
                  <textarea className={inputClass} name={`comment_${c.id}`} defaultValue={r?.comment ?? ""} rows={2} disabled={locked} />
                </div>
              );
            })}
            <Field label="Retour général à l'élève">
              <textarea className={inputClass} name="general_comment" defaultValue={source?.general_comment ?? ""} rows={4} disabled={locked} />
            </Field>
            {copy.score != null && <div className="pt-2"><PenScore score={copy.score} total={evaluation.total_points} size="lg" /></div>}
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
