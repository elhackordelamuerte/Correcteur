import "server-only";
import { balanceRubric, INTENSITY_LABELS, roundToStep } from "@/lib/rules";
import { generateJson, type Attachment } from "./providers";
import {
  appreciationSchema,
  copyAnalysisSchema,
  evaluationSchema,
  exerciseCorrectionSchema,
  exerciseSchema,
  rubricSchema,
  transcriptionSchema,
  variantSchema,
} from "./schemas";

const SYSTEM_TEACHER =
  "Tu es un assistant pédagogique pour des enseignants du secondaire français (6e à Terminale). " +
  "Tu respectes les programmes de l'Éducation nationale. Tu écris en français correct. " +
  "Tu ne mentionnes jamais d'information personnelle sur un élève.";

const SYSTEM_GRADER =
  "Tu es un correcteur rigoureux et bienveillant. Tu appliques STRICTEMENT le barème fourni, sans en inventer. " +
  "Tu ne recopies jamais un nom ou prénom visible sur la copie. Tu t'adresses à l'élève au tutoiement. " +
  "Ta proposition sera relue et validée par l'enseignant avant toute publication.";

export type CriterionInput = { id: string; label: string; expected: string; points: number };

function rubricText(criteria: CriterionInput[]): string {
  return criteria
    .map((c) => `- [${c.id}] ${c.label} (${c.points} pt) — attendu : ${c.expected || "non précisé"}`)
    .join("\n");
}

function withBalancedPoints<T extends { points: number }>(items: T[], total: number): T[] {
  const balanced = balanceRubric(items.map((i) => i.points), total);
  return items.map((item, i) => ({ ...item, points: balanced[i] }));
}

// Évaluation complète : énoncé + barème (2 crédits)
export async function generateEvaluation(input: {
  subject: string;
  level: string;
  topic: string;
  totalPoints: number;
  durationMinutes: number;
}) {
  const result = await generateJson({
    system: SYSTEM_TEACHER,
    temperature: 0.5,
    schema: evaluationSchema,
    prompt:
      `Conçois une évaluation de ${input.subject}, niveau ${input.level}, durée ${input.durationMinutes} minutes, ` +
      `sur : « ${input.topic} ». Barème total : ${input.totalPoints} points. ` +
      "Chaque critère du barème évalue une seule compétence, avec ce qui est attendu pour obtenir tous les points.",
  });
  return { ...result, criteria: withBalancedPoints(result.criteria, input.totalPoints) };
}

// Barème seul pour un énoncé existant (offert)
export async function generateRubric(input: { statement: string; subject: string; level: string; totalPoints: number }) {
  const result = await generateJson({
    system: SYSTEM_TEACHER,
    schema: rubricSchema,
    prompt:
      `Propose un barème critérié sur ${input.totalPoints} points pour cette évaluation de ${input.subject} (${input.level}).\n\n` +
      `Énoncé :\n${input.statement}`,
  });
  return withBalancedPoints(result.criteria, input.totalPoints);
}

// Transcription seule (1re passe de l'analyse approfondie, ADR-007)
export async function transcribeCopy(attachments: Attachment[]) {
  return generateJson({
    system: "Tu transcris fidèlement des copies manuscrites d'élèves. Tu remplaces tout nom ou prénom par [élève].",
    schema: transcriptionSchema,
    attachments,
    temperature: 0,
    prompt:
      "Transcris intégralement cette copie, page par page, sans corriger l'orthographe ni la syntaxe. " +
      "Décris brièvement entre crochets les schémas ou calculs posés. Indique [illisible] si nécessaire.",
  });
}

// Analyse d'une copie selon le barème figé (1 passe = rapide, 2 passes = approfondie)
export async function analyzeCopy(input: {
  statement: string;
  criteria: CriterionInput[];
  attachments: Attachment[];
  transcription?: string;
}) {
  if (input.criteria.length === 0) throw new Error("Barème vide");
  const result = await generateJson({
    system: SYSTEM_GRADER,
    schema: copyAnalysisSchema,
    attachments: input.attachments,
    temperature: 0.1,
    prompt:
      `Énoncé :\n${input.statement || "(non fourni)"}\n\nBarème (identifiants entre crochets) :\n${rubricText(input.criteria)}\n\n` +
      (input.transcription ? `Transcription vérifiée de la copie :\n${input.transcription}\n\n` : "") +
      "Pour CHAQUE critère, donne les points obtenus (multiples de 0,5, sans dépasser le maximum) et une justification. " +
      "Utilise exactement les identifiants fournis dans criterion_id.",
  });
  // Garde-fous : critères connus uniquement, points bornés et arrondis
  const criteria = input.criteria.map((c) => {
    const found = result.criteria.find((r) => r.criterion_id === c.id);
    const points = found ? Math.min(c.points, Math.max(0, roundToStep(found.points))) : 0;
    return { criterion_id: c.id, points, comment: found?.comment ?? "Critère non évalué par l'analyse : à compléter." };
  });
  return { ...result, criteria };
}

// Exercice ciblé de remédiation (1 crédit) : exactement 2 indices, difficulté 1 à 5
export async function generateExercise(input: { subject: string; level: string; competency: string; difficulty: number; context?: string }) {
  return generateJson({
    system: SYSTEM_TEACHER,
    schema: exerciseSchema,
    temperature: 0.6,
    prompt:
      `Crée un exercice de remédiation en ${input.subject} (${input.level}) ciblant la compétence « ${input.competency} ». ` +
      `Difficulté ${input.difficulty} sur 5. Fournis exactement deux indices progressifs (le second plus explicite) et une solution rédigée. ` +
      (input.context ? `Erreurs fréquentes observées : ${input.context}` : ""),
  });
}

// Correction d'une réponse d'élève à un exercice (1 crédit)
export async function correctExercise(input: { statement: string; solution: string; answer: string }) {
  return generateJson({
    system: SYSTEM_GRADER,
    schema: exerciseCorrectionSchema,
    temperature: 0.1,
    prompt:
      `Exercice :\n${input.statement}\n\nSolution de référence :\n${input.solution}\n\n` +
      `Réponse de l'élève :\n${input.answer}\n\nÉvalue le degré de réussite et rédige un retour encourageant qui nomme ce qui est réussi puis une piste.`,
  });
}

// Variante DYS / PAP (2 crédits) : même total, aucune mention de l'adaptation (ADR-015)
export async function generateVariant(input: {
  statement: string;
  criteria: CriterionInput[];
  needs: string[];
  intensity: number;
  totalPoints: number;
}) {
  const result = await generateJson({
    system: SYSTEM_TEACHER,
    schema: variantSchema,
    temperature: 0.3,
    prompt:
      `Adapte cette évaluation pour des besoins fonctionnels : ${input.needs.join(", ")}. ` +
      `Intensité ${input.intensity}/3 : ${INTENSITY_LABELS[input.intensity]}.\n` +
      "Règles : transforme la FORME (consignes découpées, choix à cocher, repères visuels, banque de mots…) " +
      "sans baisser le niveau d'exigence ; conserve les mêmes compétences ; " +
      `le barème doit totaliser exactement ${input.totalPoints} points ; ` +
      "n'écris nulle part que le sujet est adapté et ne nomme aucun trouble. " +
      "Liste les transformations appliquées.\n\n" +
      `Énoncé original :\n${input.statement}\n\nBarème original :\n${rubricText(input.criteria)}`,
  });
  return { ...result, criteria: withBalancedPoints(result.criteria, input.totalPoints) };
}

// Appréciation de bulletin (1 crédit) : neutre, sans prénom, un seul axe de progrès
export async function generateAppreciation(input: {
  subject: string;
  competencies: { label: string; status: string }[];
  average: number | null;
}) {
  const lines = input.competencies.map((c) => `- ${c.label} : ${c.status}`).join("\n");
  return generateJson({
    system: SYSTEM_TEACHER,
    schema: appreciationSchema,
    temperature: 0.5,
    prompt:
      `Rédige une appréciation de bulletin en ${input.subject || "la matière"} de 3 à 5 phrases. ` +
      (input.average !== null ? `Moyenne : ${input.average.toFixed(1)}/20. ` : "") +
      `Compétences observées :\n${lines || "(aucune observation validée)"}\n\n` +
      "Contraintes : commence par un point d'appui réel ; nomme UN SEUL axe de progression, le plus important ; " +
      "aucun prénom ; formulation neutre sans aucune marque de genre (pas d'accord masculin/féminin) ; " +
      "pas de formule générique.",
  });
}
