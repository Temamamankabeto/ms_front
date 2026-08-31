"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { useState } from "react";

import api from "@/lib/api";
import { ServiceApplicationFile } from "@/types/application-workflow";

function fileStatus(file: any) {
  return file.display_status || file.display_category || "Available";
}

function fileCategory(file: any) {
  return file.display_category || file.file_category || file.field_name || "document";
}

function fileName(file: any) {
  return file.original_name || file.stored_name || "document";
}

export default function ApplicationFilesList({
  files = [],
}: {
  files?: ServiceApplicationFile[];
}) {
  const [downloadingId, setDownloadingId] = useState<number | string | null>(null);

  if (!files.length) {
    return <p className="text-sm text-muted-foreground">No files uploaded.</p>;
  }

  async function downloadFile(file: any) {
    if (!file?.id) return;

    setDownloadingId(file.id);

    try {
      const response = await api.get(
        `/service-application-files/${file.id}/download`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || file.mime_type || "application/octet-stream",
      });

      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = fileName(file);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(objectUrl);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {files.map((file: any) => (
        <button
          key={file.id}
          type="button"
          onClick={() => downloadFile(file)}
          disabled={downloadingId === file.id}
          className="flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span className="flex min-w-0 items-center gap-3">
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />

            <span className="min-w-0">
              <span className="block truncate font-medium">
                {fileName(file)}
              </span>

              <span className="text-xs text-muted-foreground">
                {fileCategory(file)}
                {file.uploader?.name ? ` · By ${file.uploader.name}` : ""}
              </span>
            </span>
          </span>

          <span className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
              {fileStatus(file)}
            </span>

            {downloadingId === file.id ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Download className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
