import { describe, expect, it } from "vitest";
import { parseInline, parseRichText } from "@/lib/rich-text";

describe("parseInline", () => {
  it("reconnaît le gras et l'italique", () => {
    expect(parseInline("un **mot** et *autre*")).toEqual([
      { text: "un " },
      { text: "mot", bold: true },
      { text: " et " },
      { text: "autre", italic: true },
    ]);
  });

  it("laisse intacts les astérisques non fermés", () => {
    expect(parseInline("2 * 3 = 6")).toEqual([{ text: "2 * 3 = 6" }]);
  });
});

describe("parseRichText", () => {
  it("transforme une ligne entièrement en gras en intertitre", () => {
    expect(parseRichText("**1. Mélange homogène ? (3 points)**")).toEqual([
      { kind: "heading", content: [{ text: "1. Mélange homogène ? (3 points)" }] },
    ]);
  });

  it("regroupe les puces en une liste", () => {
    const blocks = parseRichText("Consigne :\n* Question a) (1 pt)\n* Question b) (2 pts)");
    expect(blocks.map((b) => b.kind)).toEqual(["paragraph", "list"]);
    expect(blocks[1]).toEqual({ kind: "list", items: [[{ text: "Question a) (1 pt)" }], [{ text: "Question b) (2 pts)" }]] });
  });

  it("garde les lignes d'un même paragraphe et fusionne les lignes vides", () => {
    const blocks = parseRichText("Nom : ....\nPrénom : ....\n\n\n\nTexte");
    expect(blocks).toEqual([
      { kind: "paragraph", lines: [[{ text: "Nom : ...." }], [{ text: "Prénom : ...." }]] },
      { kind: "paragraph", lines: [[{ text: "Texte" }]] },
    ]);
  });

  it("gère les titres Markdown et les fins de ligne Windows", () => {
    expect(parseRichText("## Partie A\r\nTexte")).toEqual([
      { kind: "heading", content: [{ text: "Partie A" }] },
      { kind: "paragraph", lines: [[{ text: "Texte" }]] },
    ]);
  });

  it("renvoie une liste vide pour un texte vide", () => {
    expect(parseRichText("")).toEqual([]);
  });
});
