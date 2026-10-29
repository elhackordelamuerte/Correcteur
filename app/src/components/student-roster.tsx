"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { addStudentsBatch, renameStudent } from "@/app/actions/classes";
import { parseRoster, rowKey, type RosterRow } from "@/lib/roster";
import { Button, Empty, inputClass, Stamp } from "./ui";

type Student = { id: string; first_name: string; last_name: string; linked: boolean };
type Tab = "single" | "paste" | "invite";

const SEARCH_THRESHOLD = 8;

function initials(s: RosterRow) {
  return `${s.first_name.charAt(0)}${s.last_name.charAt(0)}`.toUpperCase();
}

export function StudentRoster({ classId, students, joinCode, siteUrl }: { classId: string; students: Student[]; joinCode: string; siteUrl: string }) {
  const [open, setOpen] = useState<Tab | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("fr-FR");
    return q ? students.filter((s) => `${s.first_name} ${s.last_name}`.toLocaleLowerCase("fr-FR").includes(q)) : students;
  }, [query, students]);
  const linked = students.filter((s) => s.linked).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-medium tracking-tight">Élèves</h2>
        <span className="font-mono text-xs text-ink-mute">
          {students.length} · {linked} compte{linked > 1 ? "s" : ""} lié{linked > 1 ? "s" : ""}
        </span>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={() => setOpen("invite")}>Inviter</Button>
          <Button onClick={() => setOpen("paste")}>+ Ajouter des élèves</Button>
        </div>
      </div>

      {notice && (
        <p role="status" className="mb-4 animate-rise rounded-xl bg-sage-soft px-4 py-2.5 text-sm text-sage">
          {notice}
        </p>
      )}

      {students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
          <p className="font-display text-2xl">Une classe vide, pour l&apos;instant.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-mute">
            Collez la liste exportée de Pronote ou d&apos;un tableur : Copia reconnaît les noms et prénoms automatiquement.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={() => setOpen("paste")}>Coller une liste</Button>
            <Button variant="secondary" onClick={() => setOpen("single")}>Saisir un par un</Button>
          </div>
        </div>
      ) : (
        <>
          {students.length > SEARCH_THRESHOLD && (
            <input className={`${inputClass} mb-3`} placeholder="Rechercher un élève…" value={query} onChange={(e) => setQuery(e.target.value)} />
          )}
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-sheet">
            {filtered.map((s) => <RosterItem key={s.id} student={s} />)}
            {filtered.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-mute">Aucun élève ne correspond.</li>}
          </ul>
        </>
      )}

      {open && (
        <AddSheet
          tab={open}
          onTab={setOpen}
          onClose={() => setOpen(null)}
          classId={classId}
          existing={students}
          joinCode={joinCode}
          siteUrl={siteUrl}
          onDone={(message) => {
            setNotice(message);
            setOpen(null);
          }}
        />
      )}
    </div>
  );
}

function RosterItem({ student }: { student: Student }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [first, setFirst] = useState(student.first_name);
  const [last, setLast] = useState(student.last_name);
  const [error, setError] = useState("");

  async function save() {
    const result = await renameStudent(student.id, { first_name: first, last_name: last });
    if (result.error) return setError(result.error);
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <li className="flex flex-wrap items-center gap-2 bg-paper/60 px-4 py-3">
        <input className={`${inputClass} w-40`} value={first} onChange={(e) => setFirst(e.target.value)} aria-label="Prénom" autoFocus />
        <input
          className={`${inputClass} w-48`}
          value={last}
          onChange={(e) => setLast(e.target.value)}
          aria-label="Nom"
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        <Button onClick={save}>Enregistrer</Button>
        <Button variant="ghost" onClick={() => setEditing(false)}>Annuler</Button>
        {error && <span className="text-sm text-pen">{error}</span>}
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-paper/60">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/5 font-mono text-xs text-ink-soft">{initials(student)}</span>
      <Link href={`/app/eleves/${student.id}`} className="min-w-0 flex-1 truncate">
        <span className="font-medium">{student.first_name}</span> <span className="text-ink-soft">{student.last_name}</span>
      </Link>
      {student.linked ? (
        <span className="text-xs text-sage">● compte lié</span>
      ) : (
        <span className="text-xs text-ink-mute">○ sans compte</span>
      )}
      <button onClick={() => setEditing(true)} className="rounded-full px-2 py-1 text-xs text-ink-mute opacity-0 transition hover:bg-ink/5 hover:text-ink group-hover:opacity-100 focus:opacity-100">
        Renommer
      </button>
    </li>
  );
}

const TABS: { id: Tab; label: string }[] = [
  { id: "paste", label: "Coller une liste" },
  { id: "single", label: "Un par un" },
  { id: "invite", label: "Inviter" },
];

function AddSheet(props: {
  tab: Tab;
  onTab: (t: Tab) => void;
  onClose: () => void;
  classId: string;
  existing: RosterRow[];
  joinCode: string;
  siteUrl: string;
  onDone: (message: string) => void;
}) {
  const { tab, onTab, onClose } = props;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Ajouter des élèves">
      <button aria-label="Fermer" className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-xl animate-rise flex-col border-l border-line bg-sheet shadow-[-24px_0_60px_-30px_rgb(28_26_23/0.35)]">
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-display text-2xl">Ajouter des élèves</h2>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-sm text-ink-mute hover:bg-ink/5 hover:text-ink">Fermer ✕</button>
        </header>
        <nav className="flex gap-6 border-b border-line px-6" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => onTab(t.id)}
              className={`-mb-px border-b-2 py-3 text-sm transition-colors ${tab === t.id ? "border-pen font-medium text-ink" : "border-transparent text-ink-mute hover:text-ink"}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {tab === "paste" && <PasteTab {...props} />}
          {tab === "single" && <SingleTab {...props} />}
          {tab === "invite" && <InviteTab joinCode={props.joinCode} siteUrl={props.siteUrl} />}
        </div>
      </div>
    </div>
  );
}

function useSubmit(classId: string, onDone: (m: string) => void) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(rows: RosterRow[]) {
    setPending(true);
    setError("");
    const result = await addStudentsBatch(classId, rows);
    setPending(false);
    if (result.error) return setError(result.error);
    router.refresh();
    const skipped = result.skipped ? ` · ${result.skipped} doublon${result.skipped > 1 ? "s" : ""} ignoré${result.skipped > 1 ? "s" : ""}` : "";
    onDone(`${result.added} élève${(result.added ?? 0) > 1 ? "s" : ""} ajouté${(result.added ?? 0) > 1 ? "s" : ""}${skipped}.`);
  }
  return { submit, pending, error };
}

function PasteTab({ classId, existing, onDone }: { classId: string; existing: RosterRow[]; onDone: (m: string) => void }) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<(RosterRow & { duplicate: boolean })[]>([]);
  const { submit, pending, error } = useSubmit(classId, onDone);

  // L'aperçu suit le texte collé ; les corrections manuelles s'appliquent ensuite
  useEffect(() => setRows(parseRoster(text, existing)), [text, existing]);

  const update = (i: number, patch: Partial<RosterRow>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const valid = rows.filter((r) => !r.duplicate && r.first_name.trim());

  return (
    <div className="space-y-5">
      <div>
        <textarea
          className={`${inputClass} min-h-36 font-mono text-[13px]`}
          placeholder={"MARTIN Léa\nDUPONT Tom\nN'DIAYE Aïssa"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        <p className="mt-2 text-xs text-ink-mute">
          Formats reconnus : export Pronote (<span className="font-mono">NOM Prénom</span>), <span className="font-mono">Prénom Nom</span>, colonnes de tableur (Nom → Prénom). 60 élèves maximum.
        </p>
      </div>

      {rows.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-ink-mute">Aperçu — vérifiez avant d&apos;importer</p>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {rows.map((r, i) => (
              <li key={i} className={`flex items-center gap-2 px-3 py-2 ${r.duplicate ? "opacity-50" : ""}`}>
                <input className="w-full min-w-0 rounded-md bg-transparent px-2 py-1 text-sm font-medium hover:bg-ink/5 focus:bg-ink/5 focus:outline-none" value={r.first_name} onChange={(e) => update(i, { first_name: e.target.value })} aria-label="Prénom" />
                <button
                  title="Inverser prénom et nom"
                  onClick={() => update(i, { first_name: r.last_name, last_name: r.first_name })}
                  className="shrink-0 rounded-full px-2 py-1 text-ink-mute hover:bg-ink/5 hover:text-ink"
                >
                  ⇄
                </button>
                <input className="w-full min-w-0 rounded-md bg-transparent px-2 py-1 text-sm text-ink-soft hover:bg-ink/5 focus:bg-ink/5 focus:outline-none" value={r.last_name} onChange={(e) => update(i, { last_name: e.target.value })} aria-label="Nom" />
                {r.duplicate ? (
                  <span className="w-20 shrink-0 text-right text-xs text-ochre">déjà présent</span>
                ) : (
                  <button title="Retirer" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="w-20 shrink-0 rounded-full px-2 py-1 text-right text-ink-mute hover:text-pen">✕</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={() => submit(valid)} disabled={pending || valid.length === 0}>
          {pending ? "Import…" : `Importer ${valid.length} élève${valid.length > 1 ? "s" : ""}`}
        </Button>
        {error && <p className="text-sm text-pen">{error}</p>}
      </div>
    </div>
  );
}

function SingleTab({ classId, existing, onDone }: { classId: string; existing: RosterRow[]; onDone: (m: string) => void }) {
  const [queue, setQueue] = useState<RosterRow[]>([]);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [hint, setHint] = useState("");
  const firstRef = useRef<HTMLInputElement>(null);
  const { submit, pending, error } = useSubmit(classId, onDone);

  function push() {
    const row = { first_name: first.trim(), last_name: last.trim() };
    if (!row.first_name) return firstRef.current?.focus();
    const taken = new Set([...existing, ...queue].map(rowKey));
    if (taken.has(rowKey(row))) {
      setHint(`${row.first_name} ${row.last_name} est déjà dans la liste.`);
    } else {
      setQueue([...queue, row]);
      setHint("");
    }
    setFirst("");
    setLast("");
    firstRef.current?.focus();
  }

  return (
    <div className="space-y-5">
      <form
        className="grid grid-cols-[1fr_1fr_auto] items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          push();
        }}
      >
        <label className="text-xs font-medium uppercase tracking-[0.08em] text-ink-mute">
          Prénom
          <input ref={firstRef} className={`${inputClass} mt-1.5 normal-case tracking-normal`} value={first} onChange={(e) => setFirst(e.target.value)} autoFocus />
        </label>
        <label className="text-xs font-medium uppercase tracking-[0.08em] text-ink-mute">
          Nom
          <input className={`${inputClass} mt-1.5 normal-case tracking-normal`} value={last} onChange={(e) => setLast(e.target.value)} />
        </label>
        <Button type="submit" variant="secondary">Ajouter ↵</Button>
      </form>
      {hint && <p className="text-sm text-ochre">{hint}</p>}

      {queue.length === 0 ? (
        <Empty>Tapez un prénom, un nom, puis Entrée. Les élèves s&apos;ajoutent ici avant l&apos;enregistrement.</Empty>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {queue.map((r, i) => (
            <li key={rowKey(r)} className="flex animate-rise items-center gap-1.5 rounded-full border border-line-strong bg-paper py-1 pl-3 pr-1 text-sm">
              {r.first_name} <span className="text-ink-soft">{r.last_name}</span>
              <button onClick={() => setQueue(queue.filter((_, j) => j !== i))} className="rounded-full px-1.5 text-ink-mute hover:text-pen" aria-label={`Retirer ${r.first_name}`}>✕</button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={() => submit(queue)} disabled={pending || queue.length === 0}>
          {pending ? "Enregistrement…" : `Enregistrer ${queue.length} élève${queue.length > 1 ? "s" : ""}`}
        </Button>
        {error && <p className="text-sm text-pen">{error}</p>}
      </div>
    </div>
  );
}

function InviteTab({ joinCode, siteUrl }: { joinCode: string; siteUrl: string }) {
  const link = `${siteUrl}/inscription?role=student&code=${joinCode}`;
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    QRCode.toDataURL(link, { width: 200, margin: 1, color: { dark: "#1c1a17", light: "#fffdf9" } }).then(setQr);
  }, [link]);

  async function copy(value: string, what: string) {
    await navigator.clipboard.writeText(value);
    setCopied(what);
    setTimeout(() => setCopied(""), 1800);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-soft">
        Chaque élève crée son compte puis saisit le code. S&apos;il figure déjà dans la liste avec le même nom, son compte est rattaché à sa fiche ; sinon une fiche est créée.
      </p>
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-paper py-8">
        <Stamp>{joinCode}</Stamp>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {qr && <img src={qr} alt="QR code d'inscription élève" width={160} height={160} className="rounded-lg" />}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => copy(joinCode, "code")}>{copied === "code" ? "Copié ✓" : "Copier le code"}</Button>
        <Button variant="secondary" onClick={() => copy(link, "lien")}>{copied === "lien" ? "Copié ✓" : "Copier le lien d'inscription"}</Button>
      </div>
    </div>
  );
}
