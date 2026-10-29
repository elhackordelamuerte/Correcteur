import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { extractJson, generateJson, providerOrder } from "@/lib/ai/providers";

const schema = z.object({ text: z.string() });

function geminiResponse(text: string) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 });
}

function openRouterResponse(text: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content: text } }] }), { status: 200 });
}

describe("extractJson", () => {
  it("lit un JSON entouré de balises", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("ignore le texte avant le JSON", () => {
    expect(extractJson('Voici : {"a":2}')).toEqual({ a: 2 });
  });

  it("échoue sans JSON", () => {
    expect(() => extractJson("rien")).toThrow();
  });
});

describe("generateJson", () => {
  beforeEach(() => {
    vi.stubEnv("AI_PROVIDER", "gemini");
    vi.stubEnv("GEMINI_API_KEY", "g");
    vi.stubEnv("OPENROUTER_API_KEY", "o");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("ordonne les fournisseurs selon AI_PROVIDER", () => {
    expect(providerOrder()).toEqual(["gemini", "openrouter"]);
    vi.stubEnv("AI_PROVIDER", "openrouter");
    expect(providerOrder()).toEqual(["openrouter", "gemini"]);
  });

  it("exclut un fournisseur sans clé", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    expect(providerOrder()).toEqual(["gemini"]);
  });

  it("renvoie la sortie validée de Gemini", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(geminiResponse('{"text":"ok"}'));
    await expect(generateJson({ system: "s", prompt: "p", schema })).resolves.toEqual({ text: "ok" });
    expect(String(fetchMock.mock.calls[0][0])).toContain("generativelanguage.googleapis.com");
  });

  it("relance puis bascule sur OpenRouter si Gemini échoue", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("err", { status: 503 }))
      .mockResolvedValueOnce(geminiResponse('{"autre":1}'))
      .mockResolvedValueOnce(openRouterResponse('{"text":"secours"}'));
    await expect(generateJson({ system: "s", prompt: "p", schema })).resolves.toEqual({ text: "secours" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const body = JSON.parse(String(fetchMock.mock.calls[2][1]?.body));
    expect(body.provider).toEqual({ data_collection: "deny" });
  });

  it("lève une erreur explicite quand tout échoue", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response("err", { status: 500 }));
    await expect(generateJson({ system: "s", prompt: "p", schema })).rejects.toThrow(/restitués/);
  });

  it("envoie les PDF comme fichiers à OpenRouter", async () => {
    vi.stubEnv("AI_PROVIDER", "openrouter");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(openRouterResponse('{"text":"ok"}'));
    await generateJson({ system: "s", prompt: "p", schema, attachments: [{ mimeType: "application/pdf", base64: "AAA" }] });
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.messages[1].content[1].type).toBe("file");
  });
});
