import Link from "next/link";
import { createClass } from "@/app/actions/classes";
import { ActionForm } from "@/components/action-form";
import { Card, Empty, Field, inputClass, PageTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export default async function Dashboard() {
  const { supabase } = await requireRole("teacher");
  const { data: classes } = await supabase.from("classes").select("id,name,level,subject,join_code, students(count)").order("created_at");
  const { data: evaluations } = await supabase.from("evaluations").select("id,title,created_at,status,classes(name)").order("created_at", { ascending: false }).limit(6);
  const { count: toValidate } = await supabase.from("copies").select("id", { count: "exact", head: true }).eq("status", "proposed");

  return (
    <>
      <PageTitle title="Mes classes" subtitle={toValidate ? `${toValidate} copie(s) attendent votre validation.` : "Copia propose, vous validez."} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {classes?.length ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {classes.map((c) => (
                <li key={c.id}>
                  <Link href={`/app/classes/${c.id}`} className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-500">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-sm text-slate-600">{[c.level, c.subject].filter(Boolean).join(" · ")}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {(c.students as unknown as { count: number }[])[0]?.count ?? 0} élèves · code <span className="font-mono">{c.join_code}</span>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Créez votre première classe pour commencer.</Empty>
          )}
          <Card title="Dernières évaluations">
            {evaluations?.length ? (
              <ul className="divide-y divide-slate-100">
                {evaluations.map((e) => (
                  <li key={e.id} className="flex justify-between py-2 text-sm">
                    <Link className="text-brand-600 hover:underline" href={`/app/evaluations/${e.id}`}>{e.title}</Link>
                    <span className="text-slate-500">{(e.classes as unknown as { name: string })?.name} · {formatDate(e.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Aucune évaluation.</Empty>
            )}
          </Card>
        </div>
        <Card title="Nouvelle classe">
          <ActionForm action={createClass} submitLabel="Créer la classe">
            <Field label="Nom"><input className={inputClass} name="name" placeholder="4e B" required /></Field>
            <Field label="Niveau"><input className={inputClass} name="level" placeholder="4e" /></Field>
            <Field label="Matière"><input className={inputClass} name="subject" placeholder="Mathématiques" /></Field>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
