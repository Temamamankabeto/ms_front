"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type SoundAlertOptions = {
  enabled?: boolean;
  volume?: number;
  frequency?: number;
  durationMs?: number;
};

export function useSoundAlert(options: SoundAlertOptions = {}) {
  const { enabled = true, volume = 0.25, frequency = 880, durationMs = 180 } = options;
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const canUseAudio = useMemo(() => typeof window !== "undefined" && "AudioContext" in window, []);

  const unlock = useCallback(async () => {
    if (!canUseAudio) return false;

    const AudioContextClass = window.AudioContext;
    const context = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = context;

    if (context.state === "suspended") {
      await context.resume();
    }

    setIsUnlocked(true);
    return true;
  }, [canUseAudio]);

  const play = useCallback(async () => {
    if (!enabled || !canUseAudio) return;

    const unlocked = isUnlocked || (await unlock());
    if (!unlocked || !audioContextRef.current) return;

    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = Math.max(0, Math.min(volume, 1));

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + durationMs / 1000);
  }, [canUseAudio, durationMs, enabled, frequency, isUnlocked, unlock, volume]);

  useEffect(() => {
    return () => {
      audioContextRef.current?.close().catch(() => undefined);
      audioContextRef.current = null;
    };
  }, []);

  return {
    isUnlocked,
    unlock,
    play,
  };
}
