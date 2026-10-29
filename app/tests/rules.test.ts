import { describe, expect, it } from "vitest";
import { aggregateStatus, balanceRubric, generateJoinCode, roundToStep, rubricTotal, scrubNames, statusFromRatio } from "@/lib/rules";

describe("balanceRubric", () => {
  it("garde un barème déjà juste", () => {
    expect(balanceRubric([5, 5, 10], 20)).toEqual([5, 5, 10]);
  });

  it("met à l'échelle un barème qui ne tombe pas sur le total", () => {
    const result = balanceRubric([3, 3, 3], 20);
    expect(rubricTotal(result)).toBe(20);
    expect(result.every((p) => p % 0.5 === 0)).toBe(true);
  });

  it("répartit équitablement quand tous les points sont nuls", () => {
    expect(rubricTotal(balanceRubric([0, 0, 0, 0], 20))).toBe(20);
  });

  it("renvoie une liste vide sans critère", () => {
    expect(balanceRubric([], 20)).toEqual([]);
  });

  it("garantit un minimum d'un demi-point par critère", () => {
    const result = balanceRubric([100, 0.01, 0.01], 10);
    expect(Math.min(...result)).toBeGreaterThanOrEqual(0.5);
    expect(rubricTotal(result)).toBe(10);
  });
});

describe("statuts de compétence", () => {
  it.each([
    [0, "besoin"],
    [0.39, "besoin"],
    [0.4, "fragile"],
    [0.69, "fragile"],
    [0.7, "satisfaisante"],
    [1, "satisfaisante"],
  ])("ratio %s → %s", (ratio, status) => {
    expect(statusFromRatio(ratio)).toBe(status);
  });

  it("agrège les trois observations les plus récentes", () => {
    expect(aggregateStatus([0.9, 0.8, 0.9, 0, 0])).toBe("satisfaisante");
  });

  it("renvoie null sans observation", () => {
    expect(aggregateStatus([])).toBeNull();
  });
});

describe("scrubNames", () => {
  it("masque prénom et nom, sans tenir compte de la casse", () => {
    expect(scrubNames("Bravo Léa, LÉA Martin progresse.", ["Léa", "Martin"])).toBe("Bravo [élève], [élève] [élève] progresse.");
  });

  it("ignore les noms trop courts et les caractères spéciaux", () => {
    expect(scrubNames("x+y", ["x", "+"])).toBe("x+y");
  });
});

describe("generateJoinCode", () => {
  it("produit 6 caractères sans ambiguïté", () => {
    const code = generateJoinCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });

  it("est déterministe pour une source aléatoire donnée", () => {
    expect(generateJoinCode(() => [0, 1, 2, 3, 4, 5])).toBe("ABCDEF");
  });
});

describe("roundToStep", () => {
  it("arrondit au demi-point", () => {
    expect(roundToStep(2.26)).toBe(2.5);
    expect(roundToStep(2.24)).toBe(2);
  });
});
