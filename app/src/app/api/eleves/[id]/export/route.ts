import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";

// Export complet des données d'un élève au format JSON (F-10.12)
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: student } = await supabase.from("students").select("id,first_name,last_name,pseudo,created_at,classes(name,level,subject)").eq("id", id).eq("teacher_id", auth.user.id).single();
  if (!student) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const [copies, observations, assignments, appreciation] = await Promise.all([
    supabase.from("copies").select("status,mode,score,final_result,teacher_comment,validated_at,published_at,evaluations(title,total_points)").eq("student_id", id),
    supabase.from("competency_observations").select("ratio,source_type,created_at,competencies(label)").eq("student_id", id),
    supabase.from("exercise_assignments").select("status,answer,feedback,ratio,submitted_at,exercises(title,statement)").eq("student_id", id),
    supabase.from("appreciations").select("text,status,updated_at").eq("student_id", id).maybeSingle(),
  ]);
  await audit(supabase, auth.user.id, "export_student", id);

  const body = {
    exported_at: new Date().toISOString(),
    student,
    copies: copies.data ?? [],
    competency_observations: observations.data ?? [],
    exercises: assignments.data ?? [],
    appreciation: appreciation.data,
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="eleve-${student.pseudo}.json"`,
      "cache-control": "no-store",
    },
  });
}
