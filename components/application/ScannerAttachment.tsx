"use client";

import { useEffect, useRef, useState } from "react";
import { FileUp, ScanLine, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const BRIDGE = "http://127.0.0.1:17843";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];

type Props = {
  name: string;
  isRequired: boolean;
  acceptImagesOnly: boolean;
  onChange: (file: File | null) => void;
};

type ScanResult = { file: File; sessionId: string; pages: number };

export default function ScannerAttachment({ name, isRequired, acceptImagesOnly, onChange }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [pages, setPages] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    return () => {
      const id = sessionRef.current;
      if (id) void release(id);
    };
  }, []);

  async function release(id: string) {
    try {
      await fetch(`${BRIDGE}/cancel`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }), keepalive: true,
      });
    } catch { /* Session expires automatically on the bridge. */ }
  }

  function attach(next: File | null): boolean {
    if (next && (!ALLOWED_TYPES.includes(next.type) || (acceptImagesOnly && !next.type.startsWith("image/")))) {
      setError("Please attach a supported PDF, PNG, or JPEG document.");
      return false;
    }
    if (next && (next.size > MAX_FILE_BYTES || next.size === 0)) {
      setError("The document must be nonempty and 20 MB or smaller.");
      return false;
    }
    setError(null);
    setFile(next);
    onChange(next);
    return true;
  }

  async function requestScan(path: "/scan" | "/append", sessionId?: string): Promise<ScanResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 120000);
    try {
      const response = await fetch(`${BRIDGE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(path === "/scan" ? { format: acceptImagesOnly ? "png" : "pdf" } : { sessionId }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Scanner bridge returned HTTP ${response.status}.`);
      const type = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      if (!ALLOWED_TYPES.includes(type) || (acceptImagesOnly && !type.startsWith("image/"))) {
        throw new Error("Scanner returned an unsupported document type.");
      }
      const length = Number(response.headers.get("content-length") || 0);
      if (length > MAX_FILE_BYTES) throw new Error("Scanned document exceeds 20 MB.");
      const id = response.headers.get("x-scan-session");
      const count = Number(response.headers.get("x-scan-pages"));
      if (!id || !Number.isSafeInteger(count) || count < 1) throw new Error("Invalid scanner session response.");
      const blob = await response.blob();
      if (blob.size === 0 || blob.size > MAX_FILE_BYTES) throw new Error("Scanned document is empty or too large.");
      const ext = type === "application/pdf" ? "pdf" : type === "image/png" ? "png" : "jpg";
      return { file: new File([blob], `scan-${Date.now()}.${ext}`, { type }), sessionId: id, pages: count };
    } finally {
      clearTimeout(timer);
    }
  }

  async function scan(addPage: boolean) {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(true);
    setError(null);
    const previousSession = sessionRef.current;
    try {
      if (addPage && !previousSession) throw new Error("No active scanning session.");
      const result = await requestScan(addPage ? "/append" : "/scan", previousSession || undefined);
      if (!attach(result.file)) {
        if (!addPage) await release(result.sessionId);
        return;
      }
      if (!addPage && previousSession) void release(previousSession);
      sessionRef.current = result.sessionId;
      setSession(result.sessionId);
      setPages(result.pages);
    } catch (cause) {
      setError(cause instanceof Error && cause.name === "AbortError"
        ? "Scanner timed out. Check that the Canon scanner is online."
        : cause instanceof Error ? cause.message : "Scanner unavailable. You can still upload manually.");
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  }

  async function finish() {
    if (!sessionRef.current || busy) return;
    const id = sessionRef.current;
    sessionRef.current = null;
    setSession(null);
    setPages(0);
    // The combined PDF is already attached in React state; finishing only clears bridge temp files.
    try {
      await fetch(`${BRIDGE}/finish`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id }),
      });
    } catch { /* Bridge will expire the session. Attachment remains intact. */ }
  }

  function clearAttachment() {
    if (busy) return;
    const id = sessionRef.current;
    sessionRef.current = null;
    setSession(null);
    setPages(0);
    attach(null);
    if (inputRef.current) inputRef.current.value = "";
    if (id) void release(id);
  }

  function manualUpload(next: File | null) {
    if (!attach(next)) { if (inputRef.current) inputRef.current.value = ""; return; }
    const id = sessionRef.current;
    sessionRef.current = null;
    setSession(null);
    setPages(0);
    if (id) void release(id);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          ref={inputRef}
          aria-label={`Upload ${name}`}
          type="file"
          accept={acceptImagesOnly ? "image/png,image/jpeg" : "application/pdf,image/png,image/jpeg"}
          required={isRequired && !file}
          disabled={busy}
          onChange={(event) => manualUpload(event.target.files?.[0] || null)}
          className="min-w-48 flex-1"
        />
        <Button type="button" variant="outline" disabled={busy} onClick={() => void scan(false)}>
          <ScanLine className="mr-2 h-4 w-4" />{busy ? "Scanning…" : "Scan Document"}
        </Button>
      </div>
      {session && !acceptImagesOnly && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border p-3" aria-live="polite">
          <span className="text-sm">{pages} scanned {pages === 1 ? "page" : "pages"} in one PDF</span>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void scan(true)}>
            <Plus className="mr-1 h-4 w-4" /> Scan Next Page
          </Button>
          <Button type="button" size="sm" disabled={busy} onClick={() => void finish()}>
            <Check className="mr-1 h-4 w-4" /> Finish &amp; Attach
          </Button>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {file && (
        <div className="space-y-2 rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-sm"><FileUp className="h-4 w-4 shrink-0" /><span className="truncate">{file.name}</span></span>
            <Button type="button" variant="ghost" size="sm" disabled={busy} aria-label="Remove attachment" onClick={clearAttachment}><X className="h-4 w-4" /></Button>
          </div>
          {preview && (file.type === "application/pdf" ?
            <a className="text-sm underline" href={preview} target="_blank" rel="noopener noreferrer">Preview combined PDF</a> :
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Document preview" className="max-h-64 w-auto rounded border object-contain" />)}
        </div>
      )}
    </div>
  );
}
