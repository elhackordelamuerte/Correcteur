import { describe, expect, it } from "vitest";
import {
  areaRatio,
  coverTransform,
  fitWithin,
  isQuadStable,
  orderCorners,
  quadArea,
  quadTargetSize,
  type Quad,
} from "@/lib/scan/geometry";

const square: Quad = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

describe("orderCorners", () => {
  it("ordonne des coins mélangés en haut-gauche, haut-droite, bas-droite, bas-gauche", () => {
    const shuffled = [square[2], square[0], square[3], square[1]];
    expect(orderCorners(shuffled)).toEqual(square);
  });

  it("gère une feuille inclinée", () => {
    const tilted = [
      { x: 60, y: 10 },
      { x: 10, y: 40 },
      { x: 90, y: 130 },
      { x: 40, y: 160 },
    ];
    expect(orderCorners(tilted)).toEqual([tilted[1], tilted[0], tilted[2], tilted[3]]);
  });

  it("refuse un nombre de points différent de 4", () => {
    expect(() => orderCorners(square.slice(0, 3))).toThrow();
  });
});

describe("quadArea / areaRatio", () => {
  it("calcule l'aire d'un carré", () => {
    expect(quadArea(square)).toBe(10000);
  });

  it("calcule la part de l'image couverte", () => {
    expect(areaRatio(square, { width: 200, height: 100 })).toBe(0.5);
  });

  it("renvoie 0 pour une image vide", () => {
    expect(areaRatio(square, { width: 0, height: 0 })).toBe(0);
  });
});

describe("fitWithin", () => {
  it("réduit en gardant les proportions", () => {
    expect(fitWithin({ width: 4000, height: 3000 }, 2000)).toEqual({ width: 2000, height: 1500 });
  });

  it("n'agrandit jamais", () => {
    expect(fitWithin({ width: 800, height: 600 }, 2000)).toEqual({ width: 800, height: 600 });
  });
});

describe("quadTargetSize", () => {
  it("aligne sur le format A4 portrait quand le ratio est proche", () => {
    const quad: Quad = [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 1000, y: 1350 },
      { x: 0, y: 1350 },
    ];
    expect(quadTargetSize(quad, 5000)).toEqual({ width: 1000, height: 1414 });
  });

  it("aligne sur le format A4 paysage", () => {
    const quad: Quad = [
      { x: 0, y: 0 },
      { x: 1450, y: 0 },
      { x: 1450, y: 1000 },
      { x: 0, y: 1000 },
    ];
    expect(quadTargetSize(quad, 5000)).toEqual({ width: 1414, height: 1000 });
  });

  it("conserve un ratio éloigné de l'A4 et limite le plus grand côté", () => {
    expect(quadTargetSize(square, 50)).toEqual({ width: 50, height: 50 });
  });
});

describe("isQuadStable", () => {
  it("est stable si les coins bougent moins que le seuil", () => {
    const moved = square.map((p) => ({ x: p.x + 2, y: p.y - 1 })) as Quad;
    expect(isQuadStable(square, moved, 5)).toBe(true);
  });

  it("n'est pas stable si un coin bouge trop", () => {
    const moved: Quad = [square[0], square[1], { x: 120, y: 100 }, square[3]];
    expect(isQuadStable(square, moved, 5)).toBe(false);
  });

  it("n'est pas stable sans détection précédente", () => {
    expect(isQuadStable(null, square, 5)).toBe(false);
  });
});

describe("coverTransform", () => {
  it("recadre une vidéo paysage dans un écran portrait", () => {
    expect(coverTransform({ width: 400, height: 300 }, { width: 300, height: 600 })).toEqual({ scale: 2, dx: -250, dy: 0 });
  });
});
