// Géométrie pure du scanner de documents (sans dépendance au DOM ni à OpenCV) : testable

export type Point = { x: number; y: number };
// Coins ordonnés : haut-gauche, haut-droite, bas-droite, bas-gauche
export type Quad = [Point, Point, Point, Point];
export type Size = { width: number; height: number };

const A4_RATIO = Math.SQRT2; // 297 / 210
const A4_SNAP_TOLERANCE = 0.12;

// Ordonne 4 points quelconques en TL / TR / BR / BL
export function orderCorners(points: Point[]): Quad {
  if (points.length !== 4) throw new Error("Un quadrilatère doit avoir 4 coins.");
  const bySum = [...points].sort((a, b) => a.x + a.y - (b.x + b.y));
  const byDiff = [...points].sort((a, b) => a.y - a.x - (b.y - b.x));
  return [bySum[0], byDiff[0], bySum[3], byDiff[3]];
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Aire par la formule du lacet (valeur absolue)
export function quadArea(quad: Quad): number {
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    const a = quad[i];
    const b = quad[(i + 1) % 4];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

// Part de l'image couverte par le quadrilatère (0 à 1)
export function areaRatio(quad: Quad, frame: Size): number {
  const frameArea = frame.width * frame.height;
  if (frameArea <= 0) return 0;
  return quadArea(quad) / frameArea;
}

// Réduit des dimensions pour que le plus grand côté ne dépasse pas maxSide
export function fitWithin(size: Size, maxSide: number): Size {
  const scale = Math.min(1, maxSide / Math.max(size.width, size.height));
  return { width: Math.max(1, Math.round(size.width * scale)), height: Math.max(1, Math.round(size.height * scale)) };
}

// Dimensions du rectangle redressé, à partir des longueurs des côtés ;
// le ratio est aligné sur A4 s'il en est proche (portrait ou paysage)
export function quadTargetSize(quad: Quad, maxSide: number): Size {
  const [tl, tr, br, bl] = quad;
  let width = Math.max(distance(tl, tr), distance(bl, br));
  let height = Math.max(distance(tl, bl), distance(tr, br));
  const portrait = height >= width;
  const ratio = portrait ? height / width : width / height;
  if (Math.abs(ratio - A4_RATIO) / A4_RATIO <= A4_SNAP_TOLERANCE) {
    if (portrait) height = width * A4_RATIO;
    else width = height * A4_RATIO;
  }
  return fitWithin({ width, height }, maxSide);
}

// Déplacement maximal d'un coin entre deux détections
export function maxCornerShift(a: Quad, b: Quad): number {
  return Math.max(...a.map((p, i) => distance(p, b[i])));
}

// Vrai si aucun coin n'a bougé de plus de `threshold` (même unité que les points)
export function isQuadStable(previous: Quad | null, current: Quad | null, threshold: number): boolean {
  if (!previous || !current) return false;
  return maxCornerShift(previous, current) <= threshold;
}

export function scaleQuad(quad: Quad, factor: number): Quad {
  return quad.map((p) => ({ x: p.x * factor, y: p.y * factor })) as Quad;
}

// Transformation d'une image affichée en « object-fit: cover » dans un conteneur
export function coverTransform(source: Size, container: Size): { scale: number; dx: number; dy: number } {
  const scale = Math.max(container.width / source.width, container.height / source.height);
  return { scale, dx: (container.width - source.width * scale) / 2, dy: (container.height - source.height * scale) / 2 };
}
