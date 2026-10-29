import { describe, expect, it } from "vitest";
import { parseLine, parseRoster } from "@/lib/roster";

describe("parseLine", () => {
  it.each([
    ["MARTIN Léa", { first_name: "Léa", last_name: "Martin" }],
    ["Léa MARTIN", { first_name: "Léa", last_name: "Martin" }],
    ["DE LA FONTAINE Jean-Pierre", { first_name: "Jean-Pierre", last_name: "De La Fontaine" }],
    ["léa martin", { first_name: "Léa", last_name: "Martin" }],
    ["Martin\tLéa", { first_name: "Léa", last_name: "Martin" }],
    ["Martin;Léa", { first_name: "Léa", last_name: "Martin" }],
    ["N'DIAYE Aïssa", { first_name: "Aïssa", last_name: "N'Diaye" }],
    ["Léa", { first_name: "Léa", last_name: "" }],
  ])("%s", (line, expected) => {
    expect(parseLine(line)).toEqual(expected);
  });

  it("ignore les lignes vides", () => {
    expect(parseLine("   ")).toBeNull();
  });
});

describe("parseRoster", () => {
  it("détecte les doublons dans la liste et dans la classe, sans tenir compte des accents", () => {
    const rows = parseRoster("MARTIN Léa\nDUPONT Tom\nMARTIN Lea\nDURAND Inès", [{ first_name: "Inès", last_name: "Durand" }]);
    expect(rows.map((r) => r.duplicate)).toEqual([false, false, true, true]);
  });

  it("limite à 60 élèves", () => {
    const text = Array.from({ length: 80 }, (_, i) => `Élève${i} NOM`).join("\n");
    expect(parseRoster(text)).toHaveLength(60);
  });
});
