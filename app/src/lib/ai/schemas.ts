import { z } from "zod";

// Contrats de sortie IA (ADR-018) : toute réponse non conforme est rejetée

const criterionDraft = z.object({
  label: z.string().min(2).max(200),
  expected: z.string().max(1000).describe("Ce qui est attendu pour obtenir tous les points"),
  points: z.number().positive().max(100),
  competency: z.string().min(2).max(120).describe("Compétence évaluée, formulée brièvement"),
});

export const evaluationSchema = z.object({
  title: z.string().min(2).max(200),
  statement: z.string().min(10).max(12000).describe("Énoncé complet destiné aux élèves, en Markdown"),
  criteria: z.array(criterionDraft).min(1).max(20),
});

export const rubricSchema = z.object({
  criteria: z.array(criterionDraft).min(1).max(20),
});

export const transcriptionSchema = z.object({
  text: z.string().max(30000).describe("Transcription fidèle de la copie, sans corriger les fautes"),
  legibility: z.enum(["bonne", "partielle", "faible"]),
});

export const copyAnalysisSchema = z.object({
  criteria: z
    .array(
      z.object({
        criterion_id: z.string(),
        points: z.number().min(0),
        comment: z.string().max(600).describe("Justification courte, adressée à l'élève, au tutoiement"),
      }),
    )
    .min(1),
  general_comment: z.string().max(1200).describe("Retour global bienveillant, au tutoiement, commençant par un point fort"),
  confidence: z.enum(["haute", "moyenne", "faible"]),
});

export const exerciseSchema = z.object({
  title: z.string().min(2).max(200),
  statement: z.string().min(10).max(4000),
  hints: z.tuple([z.string().min(2).max(500), z.string().min(2).max(500)]),
  solution: z.string().min(1).max(4000),
  difficulty: z.number().int().min(1).max(5),
});

export const exerciseCorrectionSchema = z.object({
  ratio: z.number().min(0).max(1).describe("Degré de réussite entre 0 et 1"),
  feedback: z.string().min(2).max(1200).describe("Retour bienveillant au tutoiement"),
});

export const variantSchema = z.object({
  statement: z.string().min(10).max(12000),
  criteria: z
    .array(z.object({ label: z.string().min(2).max(200), expected: z.string().max(1000), points: z.number().positive() }))
    .min(1),
  transformations: z.array(z.string().min(2).max(300)).min(1).max(20),
});

export const appreciationSchema = z.object({
  text: z.string().min(20).max(800),
});

export type EvaluationDraft = z.infer<typeof evaluationSchema>;
export type CopyAnalysis = z.infer<typeof copyAnalysisSchema>;
