import { loadScanSession } from "@/app/actions/scan";
import { ScanUploader } from "@/components/scan-uploader";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata = { robots: { index: false, follow: false } };

// Page ouverte depuis le QR code sur le téléphone de l'enseignant : sans application ni connexion
export default async function ScanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await loadScanSession(token);
  if (!session) {
    return <main className="p-6 text-center">Ce lien de scan a expiré. Générez un nouveau QR code depuis l&apos;évaluation.</main>;
  }
  const admin = createAdminClient();
  const { data: evaluation } = await admin.from("evaluations").select("title,class_id").eq("id", session.evaluation_id).single();
  const [{ data: students }, { data: copies }] = await Promise.all([
    admin.from("students").select("id,first_name,last_name").eq("class_id", evaluation?.class_id ?? "").order("last_name"),
    admin.from("copies").select("student_id,file_paths").eq("evaluation_id", session.evaluation_id),
  ]);
  const done = new Set((copies ?? []).filter((c) => c.file_paths.length > 0).map((c) => c.student_id));
  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-xl font-bold">{evaluation?.title}</h1>
      <p className="text-sm text-slate-600">Choisissez l&apos;élève, photographiez chaque page de sa copie, puis enregistrez.</p>
      <ScanUploader
        token={token}
        students={(students ?? []).map((s) => ({ id: s.id, label: `${s.first_name} ${s.last_name.charAt(0)}.`, done: done.has(s.id) }))}
      />
    </main>
  );
}
