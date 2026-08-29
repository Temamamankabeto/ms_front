"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import api from "@/lib/api";

function backendOrigin() {
  const raw =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://127.0.0.1:8000/api";

  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/api\/?$/, "").replace(/\/$/, "");
  }
}

function protectedFileUrl(file: any) {
  if (file?.id) {
    return `${backendOrigin()}/api/service-application-files/${file.id}/download`;
  }

  const url = file?.download_url || file?.url || file?.path;

  if (!url) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/api/")) {
    return `${backendOrigin()}${url}`;
  }

  if (url.startsWith("/storage/")) {
    return `${backendOrigin()}${url}`;
  }

  return `${backendOrigin()}/storage/${String(url).replace(/^\/?storage\//, "")}`;
}

function filenameFromDisposition(header?: string | null) {
  if (!header) return null;

  const utf8 = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);

  const normal = header.match(/filename="?([^"]+)"?/i);
  return normal?.[1] || null;
}

export default function ApplicationFilesList({ files = [] }: { files?: any[] }) {
  const [openingId, setOpeningId] = useState<number | string | null>(null);

  if (!files?.length) {
    return <p className="text-sm text-muted-foreground">No files uploaded.</p>;
  }

  async function openFile(file: any) {
    const url = protectedFileUrl(file);

    if (!url) {
      toast.error("Document link not found.");
      return;
    }

    setOpeningId(file.id || file.path || file.original_name);

    try {
      const response = await api.get(url, {
        responseType: "blob",
      });

      const contentType = response.headers["content-type"] || file.mime_type || "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
      const objectUrl = URL.createObjectURL(blob);

      const name =
        filenameFromDisposition(response.headers["content-disposition"]) ||
        file.original_name ||
        file.stored_name ||
        "document";

      const link = document.createElement("a");
      link.href = objectUrl;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.download = name;

      // PDF/images open in a new tab. Other file types will download.
      if (contentType.includes("pdf") || contentType.startsWith("image/")) {
        window.open(objectUrl, "_blank", "noopener,noreferrer");
      } else {
        link.click();
      }

      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error: any) {
      toast.error(error?.message || "Unable to open document.");
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <div className="space-y-3">
      {files.map((file) => {
        const key = file.id || file.path || file.original_name;
        const isOpening = openingId === key;

        return (
          <div
            key={key}
            className="flex items-center justify-between gap-3 rounded-2xl border bg-background p-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {file.original_name || file.stored_name || "Document"}
                </p>

                <p className="text-xs text-muted-foreground">
                  {file.display_status || file.file_category || "Submitted Document"}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              disabled={isOpening}
              onClick={() => openFile(file)}
            >
              {isOpening ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
