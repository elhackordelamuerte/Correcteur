// Analyse d'une liste d'élèves collée (Pronote, tableur, saisie libre)

export type RosterRow = { first_name: string; last_name: string };
export type ParsedRow = RosterRow & { duplicate: boolean };

const MAX_ROWS = 60;
const COLUMN_SEPARATOR = /\t|;|,/;

// Un mot entièrement en majuscules (accents compris) est un nom de famille au format Pronote
function isUpperWord(word: string): boolean {
  return /\p{L}/u.test(word) && word === word.toLocaleUpperCase("fr-FR") && word !== word.toLocaleLowerCase("fr-FR");
}

function capitalize(value: string): string {
  return value
    .toLocaleLowerCase("fr-FR")
    .replace(/(^|[\s'-])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toLocaleUpperCase("fr-FR"));
}

export function parseLine(line: string): RosterRow | null {
  const clean = line.replace(/\s+/g, " ").trim();
  if (!clean) return null;

  // Colonnes : « Nom ; Prénom » (ordre des exports Pronote et tableurs)
  if (COLUMN_SEPARATOR.test(line)) {
    const [last, first] = line.split(COLUMN_SEPARATOR).map((c) => c.trim()).filter(Boolean);
    if (!last) return null;
    return first ? { first_name: capitalize(first), last_name: capitalize(last) } : { first_name: capitalize(last), last_name: "" };
  }

  const words = clean.split(" ");
  if (words.length === 1) return { first_name: capitalize(words[0]), last_name: "" };

  // « MARTIN Léa » ou « Léa MARTIN » : les mots en majuscules forment le nom
  const upper = words.filter(isUpperWord);
  if (upper.length > 0 && upper.length < words.length) {
    return {
      first_name: capitalize(words.filter((w) => !isUpperWord(w)).join(" ")),
      last_name: capitalize(upper.join(" ")),
    };
  }

  // Sinon : « Prénom Nom… »
  const [first, ...rest] = words;
  return { first_name: capitalize(first), last_name: capitalize(rest.join(" ")) };
}

export function rowKey(row: RosterRow): string {
  return `${row.first_name}|${row.last_name}`.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/\p{M}/gu, "");
}

// Analyse un collage complet ; marque les doublons (dans la liste ou déjà dans la classe)
export function parseRoster(text: string, existing: RosterRow[] = []): ParsedRow[] {
  const seen = new Set(existing.map(rowKey));
  return text
    .split(/\r?\n/)
    .map(parseLine)
    .filter((r): r is RosterRow => r !== null)
    .slice(0, MAX_ROWS)
    .map((row) => {
      const key = rowKey(row);
      const duplicate = seen.has(key);
      seen.add(key);
      return { ...row, duplicate };
    });
}
