import "server-only";
import { z } from "zod";
import { SITE_URL } from "@/lib/env";

// Pièce jointe envoyée au modèle (photo ou PDF de copie)
export type Attachment = { mimeType: string; base64: string };

export type JsonRequest<T extends z.ZodType> = {
  system: string;
  prompt: string;
  schema: T;
  attachments?: Attachment[];
  temperature?: number;
};

type ProviderName = "gemini" | "openrouter";
type RawCall = (system: string, prompt: string, attachments: Attachment[], temperature: number) => Promise<string>;

const REQUEST_TIMEOUT_MS = 55_000;
const MAX_ATTEMPTS_PER_PROVIDER = 2;

export class AiError extends Error {}

// ---------------------------------------------------------------------
// Google Gemini (API REST generateContent)
// ---------------------------------------------------------------------
const callGemini: RawCall = async (system, prompt, attachments, temperature) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiError("GEMINI_API_KEY absente");
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const parts = [
    { text: prompt },
    ...attachments.map((a) => ({ inlineData: { mimeType: a.mimeType, data: a.base64 } })),
  ];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts }],
        generationConfig: { responseMimeType: "application/json", temperature },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );
  if (!res.ok) throw new AiError(`Gemini ${res.status}`);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new AiError("Gemini : réponse vide");
  return text;
};

// ---------------------------------------------------------------------
// OpenRouter (API compatible OpenAI chat/completions)
// ---------------------------------------------------------------------
const callOpenRouter: RawCall = async (system, prompt, attachments, temperature) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AiError("OPENROUTER_API_KEY absente");
  const model = process.env.OPENROUTER_MODEL || "google/gemini-3.8-flash";
  const content = [
    { type: "text", text: prompt },
    ...attachments.map((a, i) =>
      a.mimeType === "application/pdf"
        ? { type: "file", file: { filename: `copie-${i + 1}.pdf`, file_data: `data:${a.mimeType};base64,${a.base64}` } }
        : { type: "image_url", image_url: { url: `data:${a.mimeType};base64,${a.base64}` } },
    ),
  ];
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": SITE_URL,
      "X-Title": "Copia",
    },
    body: JSON.stringify({
      model,
      temperature,
      response_format: { type: "json_object" },
      // Interdit le routage vers des fournisseurs qui conservent ou entraînent sur les données
      provider: { data_collection: "deny" },
      messages: [
        { role: "system", content: system },
        { role: "user", content },
      ],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new AiError(`OpenRouter ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw new AiError("OpenRouter : réponse vide");
  return text;
};

const PROVIDERS: Record<ProviderName, RawCall> = { gemini: callGemini, openrouter: callOpenRouter };

function isConfigured(name: ProviderName): boolean {
  return name === "gemini" ? Boolean(process.env.GEMINI_API_KEY) : Boolean(process.env.OPENROUTER_API_KEY);
}

// Ordre d'appel : fournisseur principal, puis l'autre en secours (ADR-017)
export function providerOrder(): ProviderName[] {
  const primary: ProviderName = process.env.AI_PROVIDER === "openrouter" ? "openrouter" : "gemini";
  const secondary: ProviderName = primary === "gemini" ? "openrouter" : "gemini";
  return [primary, secondary].filter(isConfigured);
}

// Extrait le JSON d'une réponse, même entourée de balises ```json
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  const start = candidate.search(/[[{]/);
  if (start < 0) throw new AiError("Aucun JSON dans la réponse");
  return JSON.parse(candidate.slice(start));
}

// Appel structuré : contrat de sortie validé par zod (ADR-018)
export async function generateJson<T extends z.ZodType>(req: JsonRequest<T>): Promise<z.infer<T>> {
  const order = providerOrder();
  if (order.length === 0) throw new AiError("Aucun fournisseur IA configuré");
  const schemaText = JSON.stringify(z.toJSONSchema(req.schema));
  const prompt = `${req.prompt}\n\nRéponds UNIQUEMENT avec un objet JSON valide conforme à ce schéma JSON :\n${schemaText}`;
  const errors: string[] = [];

  for (const name of order) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_PROVIDER; attempt++) {
      try {
        const raw = await PROVIDERS[name](req.system, prompt, req.attachments ?? [], req.temperature ?? 0.2);
        const parsed = req.schema.safeParse(extractJson(raw));
        if (parsed.success) return parsed.data;
        errors.push(`${name}#${attempt} : sortie non conforme`);
      } catch (error) {
        errors.push(`${name}#${attempt} : ${error instanceof Error ? error.message : "erreur"}`);
      }
    }
  }
  console.error("[ia] échec de tous les fournisseurs", errors);
  throw new AiError("Le service d'analyse est indisponible. Vos crédits ont été restitués.");
}
