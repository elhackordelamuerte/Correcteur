"use server";

import { revalidatePath } from "next/cache";
import { analyzeCopy, transcribeCopy } from "@/lib/ai/tasks";
import { fail, ok, type ActionState } from "@/lib/action-state";
import { audit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { withCredits } from "@/lib/credits";
import { errorMessage } from "@/lib/format";
import { roundToStep, scrubNames } from "@/lib/rules";
import { loadAttachments } from "@/lib/storage";
import { finalizeCopyUpload, prepareCopyUpload, type UploadTicket } from "@/lib/uploads";

// Une analyse interrompue (délai Vercel dépassé) peut être relancée après 5 minutes
const STUCK_ANALYSIS_MS = 5 * 60 * 1000;

function isStuck(startedAt: string | null): boolean {
  return !startedAt || Date.now() - new Date(startedAt).getTime() > STUCK_ANALYSIS_MS;
}

export async function prepareUpload(evaluationId: string, studentId: string, mimeTypes: string[]): Promise<UploadTicket | { error: string }> {
  const { supabase, user } = await requireRole("teacher");
  try {
    return await prepareCopyUpload(supabase, { teacherId: user.id, evaluationId, studentId, mimeTypes });
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function finalizeUpload(copyId: string, paths: string[]): Promise<{ error?: string }> {
  const { supabase, user } = await requireRole("teacher");
  try {
    await finalizeCopyUpload(supabase, { teacherId: user.id, copyId, paths });
    return {};
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

// Lance l'analyse IA d'une copie : rapide (1 passe) ou approfondie (transcription + analyse)
export async function runAnalysis(copyId: string, mode: "quick" | "deep"): Promise<{ error?: string }> {
  const { supabase } = await requireRole("teacher");
  const { data: copy } = await supabase
    .from("copies")
    .select("*, students(first_name,last_name), evaluations(statement,status)")
    .eq("id", copyId)
    .single();
  if (!copy) return { error: "Copie introuvable." };
  if (copy.evaluations?.status !== "ready") return { error: "Figez le barème avant de lancer la correction." };
  if (["validated", "published"].includes(copy.status)) return { error: "Copie déjà validée." };
  if (copy.status === "analyzing" && !isStuck(copy.analysis_started_at)) return { error: "Analyse déjà en cours." };
  if (copy.file_paths.length === 0) return { error: "Aucun fichier déposé." };

  const { data: criteria } = await supabase.from("criteria").select("id,label,expected,points").eq("evaluation_id", copy.evaluation_id).order("position");
  const names = [copy.students?.first_name, copy.students?.last_name].filter(Boolean) as string[];

  await supabase.from("copies").update({ status: "analyzing", mode, error: null, analysis_started_at: new Date().toISOString() }).eq("id", copyId);
  try {
    const result = await withCredits(supabase, mode === "deep" ? "copyDeep" : "copyQuick", `correction ${mode === "deep" ? "approfondie" : "rapide"}`, async () => {
      const attachments = await loadAttachments(supabase, copy.file_paths);
      const transcription = mode === "deep" ? await transcribeCopy(attachments) : null;
      const analysis = await analyzeCopy({
        statement: copy.evaluations?.statement ?? "",
        criteria: (criteria ?? []).map((c) => ({ ...c, points: Number(c.points) })),
        attachments,
        transcription: transcription?.text,
      });
      return { transcription, analysis };
    });
    // Pseudonymisation de sortie : aucun nom ne doit apparaître dans le retour (ADR-004)
    const analysis = {
      ...result.analysis,
      general_comment: scrubNames(result.analysis.general_comment, names),
      criteria: result.analysis.criteria.map((c) => ({ ...c, comment: scrubNames(c.comment, names) })),
    };
    await supabase
      .from("copies")
      .update({
        status: "proposed",
        ai_result: analysis,
        transcription: result.transcription ? scrubNames(result.transcription.text, names) : null,
      })
      .eq("id", copyId);
  } catch (error) {
    // Dégradation gracieuse : la copie reste corrigeable à la main (ADR-017)
    await supabase.from("copies").update({ status: "error", error: errorMessage(error) }).eq("id", copyId);
    return { error: errorMessage(error) };
  } finally {
    revalidatePath(`/app/evaluations/${copy.evaluation_id}`);
  }
  return {};
}

// Validation humaine obligatoire : seule source des notes et des compétences (ADR-005)
export async function validateCopy(copyId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireRole("teacher");
  const { data: copy } = await supabase.from("copies").select("id,evaluation_id,student_id,status").eq("id", copyId).single();
  if (!copy) return fail("Copie introuvable.");
  if (copy.status === "published") return fail("Copie déjà publiée.");
  const { data: criteria } = await supabase.from("criteria").select("id,points,competency_id").eq("evaluation_id", copy.evaluation_id).order("position");
  if (!criteria?.length) return fail("Barème introuvable.");

  const finalCriteria = criteria.map((c) => {
    const max = Number(c.points);
    const raw = Number(String(formData.get(`points_${c.id}`) ?? "0").replace(",", "."));
    const points = Math.min(max, Math.max(0, roundToStep(Number.isFinite(raw) ? raw : 0)));
    return { criterion_id: c.id, points, comment: String(formData.get(`comment_${c.id}`) ?? "").slice(0, 600) };
  });
  const score = finalCriteria.reduce((a, c) => a + c.points, 0);
  const generalComment = String(formData.get("general_comment") ?? "").slice(0, 1200);

  const { error } = await supabase
    .from("copies")
    .update({
      status: "validated",
      final_result: { criteria: finalCriteria, general_comment: generalComment },
      score,
      teacher_comment: generalComment,
      validated_at: new Date().toISOString(),
    })
    .eq("id", copyId);
  if (error) return fail("Validation impossible.");

  // Une observation par compétence : ratio agrégé des critères qui la portent
  const byCompetency = new Map<string, { got: number; max: number }>();
  criteria.forEach((c, i) => {
    if (!c.competency_id) return;
    const acc = byCompetency.get(c.competency_id) ?? { got: 0, max: 0 };
    byCompetency.set(c.competency_id, { got: acc.got + finalCriteria[i].points, max: acc.max + Number(c.points) });
  });
  await supabase.from("competency_observations").delete().eq("source_type", "copy").eq("source_id", copyId);
  if (byCompetency.size > 0) {
    await supabase.from("competency_observations").insert(
      [...byCompetency].map(([competencyId, v]) => ({
        teacher_id: user.id,
        student_id: copy.student_id,
        competency_id: competencyId,
        source_type: "copy",
        source_id: copyId,
        ratio: v.max > 0 ? Math.round((v.got / v.max) * 1000) / 1000 : 0,
      })),
    );
  }
  revalidatePath(`/app/evaluations/${copy.evaluation_id}`);
  return ok(`Copie validée : ${score} pt.`);
}

// Publication groupée : les élèves voient leurs résultats en même temps (ADR-016)
export async function publishEvaluation(evaluationId: string, _: ActionState): Promise<ActionState> {
  const { supabase, user } = await requireRole("teacher");
  const { data, error } = await supabase
    .from("copies")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("evaluation_id", evaluationId)
    .eq("status", "validated")
    .select("id");
  if (error) return fail("Publication impossible.");
  await audit(supabase, user.id, "publish_evaluation", evaluationId);
  revalidatePath(`/app/evaluations/${evaluationId}`);
  return ok(`${data?.length ?? 0} copie(s) publiée(s).`);
}

// Session de scan par QR code, valable 2 heures (ADR-012)
export async function createScanSession(evaluationId: string): Promise<{ token?: string; error?: string }> {
  const { supabase, user } = await requireRole("teacher");
  const { data, error } = await supabase
    .from("scan_sessions")
    .insert({ teacher_id: user.id, evaluation_id: evaluationId })
    .select("token")
    .single();
  if (error || !data) return { error: "Impossible de créer la session de scan." };
  return { token: data.token };
}
