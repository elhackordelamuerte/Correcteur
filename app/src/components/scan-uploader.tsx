"use client";

import { scanFinalizeUpload, scanPrepareUpload } from "@/app/actions/scan";
import { CopyUploader } from "./copy-uploader";

export function ScanUploader({ token, students }: { token: string; students: { id: string; label: string; done?: boolean }[] }) {
  return (
    <CopyUploader
      capture
      students={students}
      prepare={(studentId, mimes) => scanPrepareUpload(token, studentId, mimes)}
      finalize={(copyId, paths) => scanFinalizeUpload(token, copyId, paths)}
    />
  );
}
