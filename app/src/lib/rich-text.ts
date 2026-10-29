// Analyse d'un Markdown minimal (énoncés produits par l'IA) : intertitres, listes, gras, italique.
// Produit une structure de données : le rendu se fait en React, sans HTML brut (pas de risque XSS).

export type Inline = { text: string; bold?: boolean; italic?: boolean };
export type Block =
  | { kind: "heading"; content: Inline[] }
  | { kind: "paragraph"; lines: Inline[][] }
  | { kind: "list"; items: Inline[][] };

const LIST_ITEM = /^\s*[*\-•]\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;
const FULLY_BOLD = /^\s*\*\*([^*]+)\*\*\s*$/;
const INLINE_TOKEN = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;

export function parseInline(text: string): Inline[] {
  const parts: Inline[] = [];
  for (const part of text.split(INLINE_TOKEN)) {
    if (!part) continue;
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) parts.push({ text: part.slice(2, -2), bold: true });
    else if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) parts.push({ text: part.slice(1, -1), italic: true });
    else parts.push({ text: part });
  }
  return parts;
}

export function parseRichText(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: Inline[][] = [];
  let list: Inline[][] = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ kind: "paragraph", lines: paragraph });
    if (list.length) blocks.push({ kind: "list", items: list });
    paragraph = [];
    list = [];
  };

  for (const line of source.replace(/\r\n?/g, "\n").split("\n")) {
    if (!line.trim()) {
      flush();
      continue;
    }
    const heading = line.match(HEADING) ?? line.match(FULLY_BOLD);
    if (heading) {
      flush();
      blocks.push({ kind: "heading", content: parseInline(heading[1].trim()) });
      continue;
    }
    const item = line.match(LIST_ITEM);
    if (item) {
      if (paragraph.length) flush();
      list.push(parseInline(item[1].trim()));
      continue;
    }
    if (list.length) flush();
    paragraph.push(parseInline(line.trim()));
  }
  flush();
  return blocks;
}
