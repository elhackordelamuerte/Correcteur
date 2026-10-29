// Chargement paresseux d'OpenCV.js (CDN, version figée) et traitements d'image du scanner.
// Chaque cv.Mat est libéré explicitement : la mémoire WASM n'est pas gérée par le ramasse-miettes.
import { areaRatio, orderCorners, type Quad, type Size } from "./geometry";

export const OPENCV_URL = "https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.10.0-release.1/dist/opencv.js";
const LOAD_TIMEOUT_MS = 45_000;
const POLL_INTERVAL_MS = 100;
const MIN_AREA_RATIO = 0.2;

interface CvMat {
  delete(): void;
  rows: number;
  cols: number;
  data32S: Int32Array;
}
interface CvMatVector {
  size(): number;
  get(index: number): CvMat;
  delete(): void;
}
type CvOpaque = object;

// Sous-ensemble typé de l'API OpenCV.js utilisé ici
export interface Cv {
  Mat: new () => CvMat;
  MatVector: new () => CvMatVector;
  Size: new (width: number, height: number) => CvOpaque;
  Point: new (x: number, y: number) => CvOpaque;
  matFromImageData(data: ImageData): CvMat;
  matFromArray(rows: number, cols: number, type: number, values: number[]): CvMat;
  imshow(canvas: HTMLCanvasElement, mat: CvMat): void;
  cvtColor(src: CvMat, dst: CvMat, code: number): void;
  GaussianBlur(src: CvMat, dst: CvMat, size: CvOpaque, sigma: number): void;
  Canny(src: CvMat, dst: CvMat, low: number, high: number): void;
  getStructuringElement(shape: number, size: CvOpaque): CvMat;
  dilate(src: CvMat, dst: CvMat, kernel: CvMat, anchor: CvOpaque, iterations: number): void;
  findContours(src: CvMat, contours: CvMatVector, hierarchy: CvMat, mode: number, method: number): void;
  contourArea(contour: CvMat): number;
  arcLength(contour: CvMat, closed: boolean): number;
  approxPolyDP(contour: CvMat, out: CvMat, epsilon: number, closed: boolean): void;
  isContourConvex(contour: CvMat): boolean;
  getPerspectiveTransform(src: CvMat, dst: CvMat): CvMat;
  warpPerspective(src: CvMat, dst: CvMat, transform: CvMat, size: CvOpaque, flags: number): void;
  COLOR_RGBA2GRAY: number;
  RETR_LIST: number;
  CHAIN_APPROX_SIMPLE: number;
  MORPH_RECT: number;
  CV_32FC2: number;
  INTER_LINEAR: number;
}

// Enveloppe : le module Emscripten est « thenable », on évite de le passer directement à resolve()
export type CvHandle = { cv: Cv };

let loading: Promise<CvHandle> | null = null;

function isReady(value: unknown): value is Cv {
  return typeof value === "object" && value !== null && typeof (value as { Mat?: unknown }).Mat === "function";
}

function waitForRuntime(resolve: (h: CvHandle) => void, reject: (e: Error) => void) {
  const started = Date.now();
  const tick = () => {
    const holder = window as unknown as { cv?: unknown };
    const current = holder.cv;
    if (current instanceof Promise) {
      current.then(
        (mod: unknown) => {
          holder.cv = mod;
          if (isReady(mod)) resolve({ cv: mod });
          else reject(new Error("OpenCV invalide"));
        },
        () => reject(new Error("OpenCV indisponible")),
      );
      return;
    }
    if (isReady(current)) return resolve({ cv: current });
    if (Date.now() - started > LOAD_TIMEOUT_MS) return reject(new Error("Délai de chargement d'OpenCV dépassé"));
    window.setTimeout(tick, POLL_INTERVAL_MS);
  };
  tick();
}

// Charge OpenCV une seule fois par page ; un échec autorise une nouvelle tentative
export function loadOpenCv(): Promise<CvHandle> {
  if (loading) return loading;
  loading = new Promise<CvHandle>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = OPENCV_URL;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => waitForRuntime(resolve, reject);
    script.onerror = () => reject(new Error("Téléchargement d'OpenCV impossible"));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}

// Cherche la plus grande feuille (quadrilatère convexe > 20 % de l'image)
export function detectSheet(cv: Cv, image: ImageData): Quad | null {
  const src = cv.matFromImageData(image);
  const gray = new cv.Mat();
  const edges = new cv.Mat();
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);
    cv.Canny(gray, edges, 50, 150);
    cv.dilate(edges, edges, kernel, new cv.Point(-1, -1), 2);
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    const frame: Size = { width: image.width, height: image.height };
    let best: Quad | null = null;
    let bestArea = 0;
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const approx = new cv.Mat();
      try {
        const area = cv.contourArea(contour);
        if (area < bestArea || area < frame.width * frame.height * MIN_AREA_RATIO) continue;
        cv.approxPolyDP(contour, approx, 0.02 * cv.arcLength(contour, true), true);
        if (approx.rows !== 4 || !cv.isContourConvex(approx)) continue;
        const d = approx.data32S;
        const quad = orderCorners([0, 1, 2, 3].map((k) => ({ x: d[k * 2], y: d[k * 2 + 1] })));
        if (areaRatio(quad, frame) < MIN_AREA_RATIO) continue;
        best = quad;
        bestArea = area;
      } finally {
        approx.delete();
        contour.delete();
      }
    }
    return best;
  } finally {
    src.delete();
    gray.delete();
    edges.delete();
    kernel.delete();
    contours.delete();
    hierarchy.delete();
  }
}

// Redresse la feuille (perspective) dans un canvas de sortie aux dimensions `target`
export function warpSheet(cv: Cv, image: ImageData, quad: Quad, target: Size, output: HTMLCanvasElement): void {
  const src = cv.matFromImageData(image);
  const dst = new cv.Mat();
  const from = cv.matFromArray(4, 1, cv.CV_32FC2, quad.flatMap((p) => [p.x, p.y]));
  const to = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, target.width, 0, target.width, target.height, 0, target.height]);
  const transform = cv.getPerspectiveTransform(from, to);
  try {
    cv.warpPerspective(src, dst, transform, new cv.Size(target.width, target.height), cv.INTER_LINEAR);
    cv.imshow(output, dst);
  } finally {
    src.delete();
    dst.delete();
    from.delete();
    to.delete();
    transform.delete();
  }
}
