import Link from "next/link";
import { joinClass } from "@/app/actions/student-space";
import { ActionForm } from "@/components/action-form";
import { CompetencyBadge } from "@/components/status";
import { Badge, Card, Empty, Field, inputClass } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { aggregateStatus } from "@/lib/rules";
import { formatDate, formatPoints } from "@/lib/format";

export default async function StudentHome() {
  const { supabase } = await requireRole("student");
  const { data: me } = await supabase.from("students").select("id, classes(name,subject)");
  const [{ data: copies }, { data: assignments }, { data: appreciations }, { data: obs }] = await Promise.all([
    supabase.from("copies").select("id,score,published_at,evaluations(title,total_points)").eq("status", "published").order("published_at", { ascending: false }),
    supabase.from("exercise_assignments").select("id,status,exercises(title,difficulty)").order("created_at", { ascending: false }),
    supabase.from("appreciations").select("text, students(classes(subject))"),
    supabase.from("competency_observations").select("competency_id,ratio,competencies(label)").order("created_at", { ascending: false }),
  ]);

  const byCompetency = new Map<string, { label: string; ratios: number[] }>();
  for (const o of obs ?? []) {
    const label = (o.competencies as unknown as { label: string } | null)?.label ?? "";
    const entry = byCompetency.get(o.competency_id) ?? { label, ratios: [] };
    byCompetency.set(o.competency_id, { ...entry, ratios: [...entry.ratios, Number(o.ratio)] });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Salut 👋</h1>
      {(me ?? []).length === 0 ? (
        <Card title="Rejoindre ta classe">
          <ActionForm action={joinClass} submitLabel="Rejoindre">
            <Field label="Code classe (donné par ton prof)"><input className={`${inputClass} font-mono uppercase tracking-widest`} name="code" maxLength={6} required /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom"><input className={inputClass} name="first_name" required /></Field>
              <Field label="Nom"><input className={inputClass} name="last_name" required /></Field>
            </div>
          </ActionForm>
        </Card>
      ) : (
        <p className="text-sm text-slate-600">
          Tes classes : {(me ?? []).map((s) => (s.classes as unknown as { name: string })?.name).join(", ")}
        </p>
      )}

      <Card title="Tes résultats">
        {copies?.length ? (
          <ul className="divide-y divide-slate-100">
            {copies.map((c) => {
              const e = c.evaluations as unknown as { title: string; total_points: number };
              return (
                <li key={c.id} className="flex items-center justify-between py-3">
                  <Link href={`/eleve/copies/${c.id}`} className="text-brand-600 hover:underline">{e.title}</Link>
                  <span className="text-sm">{formatPoints(c.score)} / {formatPoints(e.total_points)} · {formatDate(c.published_at)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>Tes copies apparaîtront ici quand ton prof les aura publiées.</Empty>
        )}
      </Card>

      <Card title="Tes exercices">
        {assignments?.length ? (
          <ul className="divide-y divide-slate-100">
            {assignments.map((a) => {
              const ex = a.exercises as unknown as { title: string; difficulty: number };
              return (
                <li key={a.id} className="flex items-center justify-between py-3">
                  <Link href={`/eleve/exercices/${a.id}`} className="text-brand-600 hover:underline">{ex.title}</Link>
                  {a.status === "assigned" ? <Badge tone="amber">À faire</Badge> : a.status === "submitted" ? <Badge>Envoyé</Badge> : <Badge tone="green">Corrigé</Badge>}
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>Pas d&apos;exercice pour le moment.</Empty>
        )}
      </Card>

      {byCompetency.size > 0 && (
        <Card title="Tes compétences">
          <ul className="space-y-2 text-sm">
            {[...byCompetency.values()].map((c) => (
              <li key={c.label} className="flex justify-between"><span>{c.label}</span><CompetencyBadge status={aggregateStatus(c.ratios)} /></li>
            ))}
          </ul>
        </Card>
      )}

      {(appreciations ?? []).map((a, i) => (
        <Card key={i} title="Le mot de ton prof">
          <p className="italic text-slate-700">« {a.text} »</p>
        </Card>
      ))}
    </div>
  );
}
