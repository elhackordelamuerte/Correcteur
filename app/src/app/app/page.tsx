import Link from "next/link";
import { createClass } from "@/app/actions/classes";
import { ActionForm } from "@/components/action-form";
import { CopyStatus } from "@/components/status";
import { Card, Field, inputClass, PageTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", timeZone: "Europe/Paris" }).format(new Date()));
  return hour < 18 ? "Bonjour" : "Bonsoir";
}

export default async function Dashboard() {
  const { supabase, profile } = await requireRole("teacher");
  const [{ data: classes }, { data: evaluations }, { data: pending }] = await Promise.all([
    supabase.from("classes").select("id,name,level,subject,join_code, students(count), evaluations(count)").order("created_at"),
    supabase.from("evaluations").select("id,title,created_at,status,classes(name)").order("created_at", { ascending: false }).limit(5),
    supabase.from("copies").select("id, evaluation_id, evaluations(title)").eq("status", "proposed").limit(50),
  ]);
  const toValidate = new Map<string, { title: string; count: number }>();
  for (const c of pending ?? []) {
    const title = (c.evaluations as unknown as { title: string })?.title ?? "";
    const entry = toValidate.get(c.evaluation_id) ?? { title, count: 0 };
    toValidate.set(c.evaluation_id, { ...entry, count: entry.count + 1 });
  }
  const firstName = profile.display_name.split(" ")[0];

  return (
    <>
      <PageTitle eyebrow={new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} title={`${greeting()}${firstName ? `, ${firstName}` : ""}.`} />

      {toValidate.size > 0 && (
        <section className="mb-12 animate-rise">
          <h2 className="mb-4 font-display text-xl">Sur votre bureau</h2>
          <ul className="space-y-2">
            {[...toValidate].map(([id, e]) => (
              <li key={id}>
                <Link href={`/app/evaluations/${id}`} className="flex items-center justify-between rounded-2xl border border-line bg-sheet px-5 py-4 transition-colors hover:border-ink">
                  <span className="font-medium">{e.title}</span>
                  <span className="flex items-center gap-3 text-sm">
                    <span className="font-display text-xl italic text-pen">{e.count}</span>
                    <CopyStatus status="proposed" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl">Classes</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(classes ?? []).map((c, i) => (
            <Link
              key={c.id}
              href={`/app/classes/${c.id}`}
              style={{ animationDelay: `${i * 60}ms` }}
              className="group relative flex min-h-40 animate-rise flex-col justify-between rounded-2xl border border-line bg-sheet p-5 transition-all hover:-translate-y-0.5 hover:border-ink"
            >
              <div>
                <p className="font-display text-3xl font-medium tracking-tight">{c.name}</p>
                <p className="mt-1 text-sm text-ink-mute">{[c.level, c.subject].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-sm text-ink-soft">
                  {(c.students as unknown as { count: number }[])[0]?.count ?? 0} élèves · {(c.evaluations as unknown as { count: number }[])[0]?.count ?? 0} éval.
                </p>
                <span className="-rotate-3 rounded border border-dashed border-pen/60 px-1.5 font-mono text-[11px] tracking-widest text-pen/80">{c.join_code}</span>
              </div>
            </Link>
          ))}
          <Card className="min-h-40 border-dashed bg-transparent">
            <ActionForm action={createClass} submitLabel="Créer la classe" variant="secondary" className="space-y-3">
              <Field label="Nouvelle classe"><input className={inputClass} name="name" placeholder="4e B" required /></Field>
              <div className="grid grid-cols-2 gap-2">
                <input className={inputClass} name="level" placeholder="Niveau" aria-label="Niveau" />
                <input className={inputClass} name="subject" placeholder="Matière" aria-label="Matière" />
              </div>
            </ActionForm>
          </Card>
        </div>
      </section>

      {(evaluations ?? []).length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl">Dernières évaluations</h2>
          <ul className="divide-y divide-line border-y border-line">
            {(evaluations ?? []).map((e) => (
              <li key={e.id}>
                <Link href={`/app/evaluations/${e.id}`} className="flex items-baseline justify-between gap-4 py-3 transition-colors hover:text-pen">
                  <span>{e.title}</span>
                  <span className="shrink-0 text-sm text-ink-mute">{(e.classes as unknown as { name: string })?.name} · {formatDate(e.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
