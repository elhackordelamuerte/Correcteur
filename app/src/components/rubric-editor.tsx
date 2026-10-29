"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/action-state";
import { Button, Field, inputClass } from "./ui";

type Row = { label: string; expected: string; points: string; competency: string };

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  title: string;
  statement: string;
  total: number;
  initial: Row[];
};

const EMPTY_ROW: Row = { label: "", expected: "", points: "", competency: "" };

export function RubricEditor({ action, title, statement, total, initial }: Props) {
  const [rows, setRows] = useState<Row[]>(initial.length ? initial : [EMPTY_ROW]);
  const [state, formAction, pending] = useActionState(action, null);
  const sum = rows.reduce((a, r) => a + (Number(r.points.replace(",", ".")) || 0), 0);
  const balanced = Math.abs(sum - total) < 0.001;

  const update = (i: number, key: keyof Row, value: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [key]: value } : r)));

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Titre"><input className={inputClass} name="title" defaultValue={title} /></Field>
      <Field label="Énoncé"><textarea className={inputClass} name="statement" defaultValue={statement} rows={8} /></Field>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Barème</h3>
          <span className={`text-sm font-medium ${balanced ? "text-emerald-700" : "text-amber-700"}`}>
            Somme : {sum.toLocaleString("fr-FR")} / {total} {balanced ? "✓" : "— doit égaler le total"}
          </span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-12">
            <input className={`${inputClass} md:col-span-4`} name="label" placeholder="Critère" value={r.label} onChange={(e) => update(i, "label", e.target.value)} />
            <input className={`${inputClass} md:col-span-3`} name="competency" placeholder="Compétence" value={r.competency} onChange={(e) => update(i, "competency", e.target.value)} />
            <input className={`${inputClass} md:col-span-2`} name="points" placeholder="Points" inputMode="decimal" value={r.points} onChange={(e) => update(i, "points", e.target.value)} />
            <button type="button" className="text-sm text-red-600 md:col-span-3 md:text-right" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Retirer</button>
            <input className={`${inputClass} md:col-span-12`} name="expected" placeholder="Attendu pour obtenir tous les points" value={r.expected} onChange={(e) => update(i, "expected", e.target.value)} />
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={() => setRows([...rows, EMPTY_ROW])}>+ Ajouter un critère</Button>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</Button>
        {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
        {state?.ok && <p className="text-sm text-emerald-700">{state.ok}</p>}
      </div>
    </form>
  );
}
