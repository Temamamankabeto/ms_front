"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { qrSvgDataUrl } from "@/lib/qr/qr-svg";
import { toast } from "sonner";

type Status = {
  issued: boolean;
  active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  credential: string | null;
  reprint_available: boolean;
};

function localInputDate(date: Date): string {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
}

function toIso(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) || parsed <= new Date() ? null : parsed.toISOString();
}

export function UserQrCard({ userId, name }: { userId: string | number; name: string }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [expiry, setExpiry] = useState(() => localInputDate(new Date(Date.now() + 365 * 86400000)));
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const url = `/admin/users/${userId}/qr-credential`;

  const refresh = useCallback(async () => {
    const { data } = await api.get(url);
    const value = data.data as Status;
    setStatus(value);
    if (value.expires_at) setExpiry(localInputDate(new Date(value.expires_at)));
  }, [url]);

  useEffect(() => {
    let alive = true;
    api.get(url).then(({ data }) => {
      if (!alive) return;
      const value = data.data as Status;
      setStatus(value);
      if (value.expires_at) setExpiry(localInputDate(new Date(value.expires_at)));
    }).catch(() => { if (alive) toast.error("Unable to load QR credential"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [url]);

  const issue = async () => {
    const expires_at = toIso(expiry);
    if (!expires_at) return toast.error("Choose a future expiration date and time.");
    if (!window.confirm("Generate a QR login card? Any previous card will stop working.")) return;
    setBusy(true);
    try {
      await api.post(url, { expires_at });
      await refresh();
      toast.success("QR login card generated and available for reprinting.");
    } catch { toast.error("Unable to generate QR credential"); }
    finally { setBusy(false); }
  };

  const updateExpiry = async () => {
    const expires_at = toIso(expiry);
    if (!expires_at) return toast.error("Choose a future expiration date and time.");
    setBusy(true);
    try {
      await api.patch(`${url}/expiry`, { expires_at });
      await refresh();
      toast.success("Expiration updated. Existing QR card remains valid.");
    } catch { toast.error("Unable to update QR expiration"); }
    finally { setBusy(false); }
  };

  const revoke = async () => {
    if (!window.confirm("Immediately revoke this user's QR login card?")) return;
    setBusy(true);
    try {
      await api.delete(url);
      setStatus({ issued: false, active: false, expires_at: null, last_used_at: null, credential: null, reprint_available: false });
      toast.success("QR login card revoked");
    } catch { toast.error("Unable to revoke QR credential"); }
    finally { setBusy(false); }
  };

  const print = () => {
    if (!status?.active || !status.credential) return;
    const popup = window.open("", "_blank", "width=480,height=650");
    if (!popup) return toast.error("Allow popups to print the QR card.");
    const qr = qrSvgDataUrl(status.credential);
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>MESOB QR Login Card</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:24px}img{width:270px;height:270px}p{font-size:13px}@media print{button{display:none}}</style></head><body><h2>ADAMA MESOB eService</h2><h3 id="user-name"></h3><img alt="QR login card" src="${qr}"/><p id="expiry"></p><p>Confidential login credential. Report lost cards immediately.</p></body></html>`);
    const nameElement = popup.document.getElementById("user-name");
    const expiryElement = popup.document.getElementById("expiry");
    if (nameElement) nameElement.textContent = name;
    if (expiryElement) expiryElement.textContent = `Expires: ${new Date(status.expires_at!).toLocaleString()}`;
    popup.document.close();
    popup.addEventListener("load", () => popup.print(), { once: true });
  };

  const canPrint = Boolean(status?.active && status.credential);

  return (
    <section className="space-y-4 rounded-xl border p-5">
      <h2 className="font-semibold">QR camera login card</h2>
      {loading ? <p className="text-sm text-muted-foreground">Loading QR credential...</p> : (
        <>
          <p className="text-sm text-muted-foreground">
            {status?.active ? `Active until ${new Date(status.expires_at!).toLocaleString()}` : status?.issued ? "QR credential expired or user inactive" : "No QR credential generated"}
          </p>
          {canPrint && status?.credential && (
            <div className="space-y-3">
              <img src={qrSvgDataUrl(status.credential)} alt={`QR login card for ${name}`} className="h-56 w-56 max-w-full" />
              <Button type="button" variant="outline" onClick={print}>Print / Reprint QR card</Button>
              <p className="text-xs text-amber-700">Anyone holding a readable copy of this QR can sign in. Store and print securely.</p>
            </div>
          )}
          {status?.issued && status.active && !status.reprint_available && (
            <p className="text-sm text-amber-700">This older QR credential cannot be retrieved. Regenerate it once to enable secure reprinting.</p>
          )}
          <div className="max-w-sm space-y-2">
            <label htmlFor={`qr-expiry-${userId}`} className="block text-sm font-medium">QR expiration date and time</label>
            <Input id={`qr-expiry-${userId}`} type="datetime-local" value={expiry} min={localInputDate(new Date())} onChange={(event) => setExpiry(event.target.value)} disabled={busy} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => void issue()}>{status?.issued ? "Regenerate QR" : "Generate QR"}</Button>
            {status?.issued && <Button type="button" variant="outline" disabled={busy} onClick={() => void updateExpiry()}>Save expiration date</Button>}
            {status?.issued && <Button type="button" variant="destructive" disabled={busy} onClick={() => void revoke()}>Revoke QR</Button>}
          </div>
        </>
      )}
    </section>
  );
}
