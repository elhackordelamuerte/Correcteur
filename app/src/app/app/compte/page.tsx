import { Card, PageTitle } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getAccount } from "@/lib/credits";
import { formatDate } from "@/lib/format";
import { CREDIT_COSTS } from "@/lib/rules";

const COST_LABELS: Record<keyof typeof CREDIT_COSTS, string> = {
  copyQuick: "Correction d'une copie — analyse rapide",
  copyDeep: "Correction d'une copie — analyse approfondie",
  rubric: "Proposition de barème",
  evaluation: "Évaluation complète (énoncé + barème)",
  exercise: "Exercice ciblé",
  exerciseCorrection: "Correction d'un exercice rendu",
  variant: "Variante DYS / PAP",
  appreciation: "Appréciation de bulletin",
};

const PLANS = [
  { name: "Pro", price: "29,99 € / mois", credits: 120, classes: "3 classes" },
  { name: "Expert", price: "59,99 € / mois", credits: 250, classes: "Classes illimitées, carte des compétences, suivi dans le temps" },
];

export default async function AccountPage() {
  const { supabase, user } = await requireRole("teacher");
  const account = await getAccount(supabase, user.id);
  const { data: ledger } = await supabase.from("credit_ledger").select("*").order("created_at", { ascending: false }).limit(50);
  return (
    <>
      <PageTitle title="Compte & crédits" subtitle="Un crédit, c'est une action de l'IA. Ce que vous faites à la main ne coûte rien." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Solde">
          <p className="text-4xl font-bold text-brand-700">{(account?.included_balance ?? 0) + (account?.purchased_balance ?? 0)}</p>
          <p className="mt-2 text-sm text-slate-600">
            {account?.included_balance} inclus (remis à {account?.included_credits} chaque mois) + {account?.purchased_balance} achetés ou restitués.
          </p>
          {account?.plan === "trial" && <p className="mt-2 text-sm text-slate-600">Essai jusqu&apos;au {formatDate(account.trial_ends_at)}.</p>}
        </Card>
        <Card title="Forfaits" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {PLANS.map((p) => (
              <div key={p.name} className="rounded-lg border border-slate-200 p-4">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm">{p.price} · {p.credits} crédits / mois</p>
                <p className="text-xs text-slate-500">{p.classes}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500">Paiement en ligne : à brancher sur Stripe (voir le README). Les recharges ne sont pas encore disponibles.</p>
        </Card>
        <Card title="Coût des actions">
          <ul className="space-y-1 text-sm">
            {Object.entries(COST_LABELS).map(([k, label]) => (
              <li key={k} className="flex justify-between gap-2"><span>{label}</span><span className="font-medium">{CREDIT_COSTS[k as keyof typeof CREDIT_COSTS]}</span></li>
            ))}
          </ul>
        </Card>
        <Card title="Historique" className="lg:col-span-2">
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto text-sm">
            {(ledger ?? []).map((l) => (
              <li key={l.id} className="flex justify-between py-1.5">
                <span>{formatDate(l.created_at)} · {l.reason}</span>
                <span className={l.delta < 0 ? "text-slate-700" : "text-emerald-700"}>{l.delta > 0 ? `+${l.delta}` : l.delta}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
