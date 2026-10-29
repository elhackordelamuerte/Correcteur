import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { formatPoints } from "@/lib/format";
import { PrintButton } from "@/components/print-button";

// Impression possible uniquement après validation (F-07.7) ; aucune mention d'adaptation (F-07.6)
export default async function VariantPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole("teacher");
  const { data: variant } = await supabase.from("variants").select("*, evaluations(title)").eq("id", id).eq("status", "validated").single();
  if (!variant) notFound();
  const content = variant.content as { statement: string; criteria: { label: string; points: number }[] };
  return (
    <article className="mx-auto max-w-3xl bg-sheet p-8">
      <div className="no-print mb-6"><PrintButton /></div>
      <h1 className="mb-6 text-2xl font-bold">{(variant.evaluations as { title: string }).title}</h1>
      <p className="prose-copia text-lg leading-loose">{content.statement}</p>
      <ul className="mt-8 border-t pt-4 text-sm text-ink-soft">
        {content.criteria.map((c) => <li key={c.label}>{c.label} — {formatPoints(c.points)} pt</li>)}
      </ul>
    </article>
  );
}
