"use client";

import { useRouter } from "next/navigation";
import { finalizeUpload, prepareUpload } from "@/app/actions/copies";
import { CopyUploader } from "./copy-uploader";

export function EvaluationUploader({ evaluationId, students }: { evaluationId: string; students: { id: string; label: string; done?: boolean }[] }) {
  const router = useRouter();
  return (
    <CopyUploader
      students={students}
      prepare={(studentId, mimes) => prepareUpload(evaluationId, studentId, mimes)}
      finalize={finalizeUpload}
      onUploaded={() => router.refresh()}
    />
  );
}
