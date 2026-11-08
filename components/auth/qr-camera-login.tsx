"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Camera, CameraOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type QrCameraLoginProps = {
  onScan: (value: string) => Promise<void>;
  busy: boolean;
};

const MESOB_QR_PATTERN = /^mesobqr1\.[A-Za-z0-9]{80}$/;

export function QrCameraLogin({ onScan, busy }: QrCameraLoginProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const sessionRef = useRef(0);
  const scanningRef = useRef(false);
  const mountedRef = useRef(false);
  const [enabled, setEnabled] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const stop = useCallback(() => {
    sessionRef.current += 1;
    controlsRef.current?.stop();
    controlsRef.current = null;

    const element = videoRef.current;
    const media = element?.srcObject;
    if (media instanceof MediaStream) {
      media.getTracks().forEach((track) => track.stop());
    }
    if (element) element.srcObject = null;

    if (mountedRef.current) {
      setEnabled(false);
      setStarting(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      sessionRef.current += 1;
      controlsRef.current?.stop();
      controlsRef.current = null;
      const element = videoRef.current;
      const media = element?.srcObject;
      if (media instanceof MediaStream) {
        media.getTracks().forEach((track) => track.stop());
      }
      if (element) element.srcObject = null;
    };
  }, []);

  const start = async () => {
    if (starting || enabled || busy || scanningRef.current) return;
    setError("");

    if (!window.isSecureContext) {
      setError("Camera access requires HTTPS or localhost.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is unavailable. Check your browser and device.");
      return;
    }

    const element = videoRef.current;
    if (!element) {
      setError("Camera preview is unavailable.");
      return;
    }

    const session = ++sessionRef.current;
    setStarting(true);

    try {
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 200,
        delayBetweenScanSuccess: 500,
      });
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      if (session !== sessionRef.current) return;
      if (devices.length === 0) throw new Error("No camera was found on this device.");

      const preferredCamera = devices.find((device) =>
        /back|rear|environment/i.test(device.label)
      ) ?? devices[0];

      const controls = await reader.decodeFromVideoDevice(
        preferredCamera.deviceId,
        element,
        (result, _decodeError, scannerControls) => {
          if (session !== sessionRef.current || scanningRef.current || !result) return;
          const value = result.getText().trim();
          if (!MESOB_QR_PATTERN.test(value)) return;

          scanningRef.current = true;
          scannerControls.stop();
          stop();

          void (async () => {
            try {
              await onScan(value);
            } catch {
              if (mountedRef.current) {
                setError("QR login failed. Please try again or use your password.");
              }
            } finally {
              scanningRef.current = false;
            }
          })();
        }
      );

      if (session !== sessionRef.current) {
        controls.stop();
        return;
      }
      controlsRef.current = controls;
      if (mountedRef.current) setEnabled(true);
    } catch (cause) {
      if (session !== sessionRef.current) return;
      stop();
      if (!mountedRef.current) return;
      if (cause instanceof DOMException && (cause.name === "NotAllowedError" || cause.name === "PermissionDeniedError")) {
        setError("Camera permission was denied. Allow camera access in your browser settings.");
      } else if (cause instanceof DOMException && (cause.name === "NotFoundError" || cause.name === "NotReadableError")) {
        setError("Camera is unavailable or is being used by another application.");
      } else {
        setError(cause instanceof Error ? cause.message : "Unable to start QR scanner.");
      }
    } finally {
      if (mountedRef.current && session === sessionRef.current) setStarting(false);
    }
  };

  return (
    <div className="space-y-3">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        aria-label="MESOB QR code camera preview"
        className={enabled || starting ? "w-full rounded-xl bg-black" : "hidden"}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={busy || starting}
        onClick={enabled ? stop : () => void start()}
      >
        {busy || starting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : enabled ? (
          <CameraOff className="mr-2 h-4 w-4" />
        ) : (
          <Camera className="mr-2 h-4 w-4" />
        )}
        {starting ? "Starting camera..." : enabled ? "Stop camera" : "Scan MESOB QR card"}
      </Button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-slate-500">
        QR cards are bearer credentials. Keep yours private; report lost cards immediately.
      </p>
    </div>
  );
}
