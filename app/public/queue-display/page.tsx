"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Volume2, VolumeX, Monitor, MapPin, Settings2 } from "lucide-react";

type Level = "city" | "subcity" | "woreda";
type Office = { administrative_level: Level; city_id: number; subcity_id: number | null; woreda_id: number | null };
type Ticket = { id: number; ticket_number: string; window_id: number; window_name: string | null; window_title: string | null; service_name: string; status: string };
type Announcement = { id: number; action: "call" | "recall"; ticket_number: string; window_id: number; window_name: string | null; window_title: string | null; counter_number?: string | null };
type QueueData = { location: Office; called: Ticket[]; serving: Ticket[]; waiting: Ticket[]; announcements: Announcement[]; latest_event_id: number };
type ApiResponse = { success: boolean; message: string; data: QueueData };

const STORAGE_KEY = "mesob_public_display_pinned_location_v1";
type City = { id: number; name: string };
type Subcity = { id: number; city_id: number; name: string };
type Woreda = { id: number; city_id: number | null; subcity_id: number; name: string };
type Locations = { cities: City[]; subcities: Subcity[]; woredas: Woreda[] };
type SavedPin = { level: Level; id: number; name: string; city_id: number; subcity_id: number | null; woreda_id: number | null };
const AUDIO_ROOT = "/audio/oromo";

function positive(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function findLocation(locations: Locations, level: Level, id: number): SavedPin | null {
  if (level === "city") {
    const city = locations.cities.find((item) => item.id === id);
    return city ? { level, id, name: city.name, city_id: id, subcity_id: null, woreda_id: null } : null;
  }
  if (level === "subcity") {
    const subcity = locations.subcities.find((item) => item.id === id);
    return subcity && locations.cities.some((city) => city.id === subcity.city_id)
      ? { level, id, name: subcity.name, city_id: subcity.city_id, subcity_id: id, woreda_id: null } : null;
  }
  const woreda = locations.woredas.find((item) => item.id === id);
  const subcity = locations.subcities.find((item) => item.id === woreda?.subcity_id);
  if (!woreda || !subcity || (woreda.city_id !== null && woreda.city_id !== subcity.city_id) || !locations.cities.some((city) => city.id === subcity.city_id)) return null;
  return { level, id, name: woreda.name, city_id: subcity.city_id, subcity_id: subcity.id, woreda_id: id };
}

function readOffice(locations: Locations): { office: Office; name: string } | null {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!raw || typeof raw !== "object") return null;
    const pin = raw as Record<string, unknown>;
    if ((pin.level !== "city" && pin.level !== "subcity" && pin.level !== "woreda") || !positive(pin.id)) return null;
    const match = findLocation(locations, pin.level, pin.id);
    if (!match || match.city_id !== pin.city_id || match.subcity_id !== pin.subcity_id || match.woreda_id !== pin.woreda_id) return null;
    return { office: { administrative_level: match.level, city_id: match.city_id, subcity_id: match.subcity_id, woreda_id: match.woreda_id }, name: match.name };
  } catch { return null; }
}

type PlaybackSignal = { cancelled: boolean; stop?: () => void };

function spokenCounter(event: Announcement): string {
  // Prefer a configured numeric public counter label. Never spell arbitrary title text
  // as digits; older installations may only have a numeric window ID.
  const candidates = [event.counter_number, event.window_name, event.window_title];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = candidate.trim().match(/^(?:(?:counter|window|desk|lak\.?|lakk\.?)\s*[-:#]?\s*)?(\d+)$/i);
    if (match) return match[1];
  }
  return String(event.window_id);
}

function makeAudioList(event: Announcement): string[] {
  // Original QMS Oromo recording convention: ticket number, digits, counter, go.
  // Use the public-facing numeric counter label when available.
  const ticketCharacters = event.ticket_number.toUpperCase().split("").flatMap((c) => {
    if (/^[0-9]$/.test(c)) return [`${AUDIO_ROOT}/digits/${c}.mp3`];
    if (c === "T") return [`${AUDIO_ROOT}/digits/TT.mp3`];
    return [];
  });
  const counterCharacters = spokenCounter(event).split("").map((c) => `${AUDIO_ROOT}/counter/${c}.mp3`);
  return ["/sounds/ding.wav", `${AUDIO_ROOT}/ticket_number.mp3`, ...ticketCharacters,
    `${AUDIO_ROOT}/please_go_to_counter.mp3`, ...counterCharacters, `${AUDIO_ROOT}/go.mp3`];
}

async function playClip(url: string, signal: PlaybackSignal): Promise<void> {
  if (signal.cancelled) return;
  const audio = new Audio(url);
  audio.preload = "auto";
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      window.clearTimeout(timeout);
      audio.onended = null;
      audio.onerror = null;
      signal.stop = undefined;
    };
    const done = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      audio.pause();
      if (error) reject(error);
      else resolve();
    };
    const timeout = window.setTimeout(() => done(new Error(`Audio timed out: ${url}`)), 6500);
    signal.stop = () => done();
    audio.onended = () => done();
    audio.onerror = () => done(new Error(`Missing or unsupported audio: ${url}`));
    if (signal.cancelled) { done(); return; }
    void audio.play().catch((error: unknown) => done(error instanceof Error ? error : new Error("Audio playback blocked")));
  });
}

export default function PublicQueueDisplayPage() {
  const [locations, setLocations] = useState<Locations | null>(null);
  const [locationError, setLocationError] = useState("");
  const [configOpen, setConfigOpen] = useState(false);
  const [level, setLevel] = useState<Level>("city");
  const [cityId, setCityId] = useState<number | null>(null);
  const [subcityId, setSubcityId] = useState<number | null>(null);
  const [woredaId, setWoredaId] = useState<number | null>(null);
  const [selected, setSelected] = useState<{ office: Office; name: string } | null>(null);
  const [data, setData] = useState<QueueData | null>(null);
  const [error, setError] = useState("");
  const [sound, setSound] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [clock, setClock] = useState("");
  const [waitingPage, setWaitingPage] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(900);
  const cursor = useRef<number | null>(null);
  const busy = useRef(false);
  const playbackQueue = useRef<Announcement[]>([]);
  const playing = useRef(false);
  const soundRef = useRef(false);
  const cancelled = useRef<PlaybackSignal>({ cancelled: false });

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/public/locations", { signal: controller.signal, cache: "no-store" });
        const payload = await response.json() as { success: boolean; message: string; data: Locations };
        if (!response.ok || !payload.success || !Array.isArray(payload.data?.cities) || !Array.isArray(payload.data?.subcities) || !Array.isArray(payload.data?.woredas)) throw new Error(payload.message || "Unable to load locations");
        if (controller.signal.aborted) return;
        setLocations(payload.data);
        const pinned = readOffice(payload.data);
        setSelected(pinned);
        if (pinned) {
          setLevel(pinned.office.administrative_level);
          setCityId(pinned.office.city_id);
          setSubcityId(pinned.office.subcity_id);
          setWoredaId(pinned.office.woreda_id);
        } else setConfigOpen(true);
      } catch (cause) {
        if (!controller.signal.aborted) setLocationError(cause instanceof Error ? cause.message : "Unable to load locations");
      }
    })();
    const measure = () => setViewportHeight(window.innerHeight);
    measure();
    window.addEventListener("resize", measure);
    const updateClock = () => setClock(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => { controller.abort(); window.clearInterval(interval); window.removeEventListener("resize", measure); };
  }, []);

  const drain = useCallback(async () => {
    if (playing.current || !soundRef.current) return;
    playing.current = true;
    const signal = cancelled.current;
    try {
      while (playbackQueue.current.length && soundRef.current && !signal.cancelled) {
        const item = playbackQueue.current.shift();
        if (!item) break;
        try {
          for (const url of makeAudioList(item)) {
            if (!soundRef.current || signal.cancelled) break;
            await playClip(url, signal);
          }
          setAudioError("");
        } catch (e) {
          setAudioError(e instanceof Error ? e.message : "Audio could not be played");
          // Do not repeatedly attempt a missing clip for the same announcement.
        }
      }
    } finally {
      playing.current = false;
      if (soundRef.current && playbackQueue.current.length && !cancelled.current.cancelled) {
        queueMicrotask(() => void drain());
      }
    }
  }, []);

  useEffect(() => {
    if (!selected) return;
    let disposed = false;
    const scope = selected.office;
    cursor.current = null;
    playbackQueue.current = [];
    cancelled.current.cancelled = true;
    cancelled.current.stop?.();
    cancelled.current = { cancelled: false };
    setData(null);
    const poll = async () => {
      if (busy.current || disposed) return;
      busy.current = true;
      try {
        const params = new URLSearchParams({ administrative_level: scope.administrative_level, city_id: String(scope.city_id) });
        if (scope.subcity_id !== null) params.set("subcity_id", String(scope.subcity_id));
        if (scope.woreda_id !== null) params.set("woreda_id", String(scope.woreda_id));
        if (cursor.current !== null) params.set("after_event_id", String(cursor.current));
        const response = await fetch(`/api/public/queue-display?${params.toString()}`, { cache: "no-store" });
        const payload = await response.json() as ApiResponse;
        if (!response.ok || !payload.success) throw new Error(payload.message || `HTTP ${response.status}`);
        if (disposed) return;
        setData(payload.data);
        setError("");
        cursor.current = payload.data.latest_event_id;
        if (payload.data.announcements.length) {
          playbackQueue.current.push(...payload.data.announcements);
          void drain();
        }
      } catch (e) {
        if (!disposed) setError(e instanceof Error ? e.message : "Queue refresh failed");
      } finally { busy.current = false; }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 3000);
    return () => { disposed = true; window.clearInterval(timer); };
  }, [selected, drain]);

  useEffect(() => () => { cancelled.current.cancelled = true; cancelled.current.stop?.(); }, []);

  const officeId = level === "city" ? cityId : level === "subcity" ? subcityId : woredaId;
  const availableSubcities = locations?.subcities.filter((item) => item.city_id === cityId) ?? [];
  const availableWoredas = locations?.woredas.filter((item) => item.subcity_id === subcityId && (item.city_id === null || item.city_id === cityId)) ?? [];
  const pinOffice = () => {
    if (!locations || officeId === null) return;
    const pin = findLocation(locations, level, officeId);
    if (!pin || pin.city_id !== cityId || (level !== "city" && pin.subcity_id !== subcityId)) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pin));
      cursor.current = null;
      playbackQueue.current = [];
      cancelled.current.cancelled = true;
      cancelled.current.stop?.();
      cancelled.current = { cancelled: false };
      setWaitingPage(0);
      setSelected({ office: { administrative_level: pin.level, city_id: pin.city_id, subcity_id: pin.subcity_id, woreda_id: pin.woreda_id }, name: pin.name });
      setLocationError("");
      setConfigOpen(false);
    } catch { setLocationError("Unable to save TV location in this browser."); }
  };

  const toggleSound = async () => {
    if (soundRef.current) {
      soundRef.current = false;
      setSound(false);
      playbackQueue.current = [];
      cancelled.current.cancelled = true;
      cancelled.current.stop?.();
      return;
    }
    // This click is a user gesture, required by TV/browser autoplay policies.
    cancelled.current = { cancelled: false };
    soundRef.current = true;
    setSound(true);
    setAudioError("");
    void drain();
  };

  // Keep every active call/service visible. Page only waiting tickets on crowded TVs.
  const activeCount = (data?.called.length ?? 0) + (data?.serving.length ?? 0);
  const visibleRowCapacity = Math.max(4, Math.floor((viewportHeight - 230) / 66));
  const waitingPageSize = Math.max(1, visibleRowCapacity - activeCount);
  const waitingCount = data?.waiting.length ?? 0;
  const waitingPages = Math.max(1, Math.ceil(waitingCount / waitingPageSize));
  const currentPage = waitingPage % waitingPages;
  const visibleWaiting = data?.waiting.slice(currentPage * waitingPageSize, (currentPage + 1) * waitingPageSize) ?? [];

  useEffect(() => {
    const timer = window.setInterval(() => setWaitingPage((page) => page + 1), 10000);
    return () => window.clearInterval(timer);
  }, []);

  const rows = [
    ...(data?.called ?? []).map((ticket) => ({ ticket, label: "CALLING · WAAMAMAA JIRA", status: "called" })),
    ...(data?.serving ?? []).map((ticket) => ({ ticket, label: "SERVING · TAJAAJILAMAA JIRA", status: "serving" })),
    ...visibleWaiting.map((ticket) => ({ ticket, label: "WAITING · EEGAA JIRA", status: "waiting" })),
  ];

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 px-3 py-3 text-white md:h-screen md:overflow-hidden md:px-6">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
        <div className="flex items-center gap-3">
          <Monitor className="h-8 w-8 shrink-0 text-amber-300" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-bold md:text-3xl">MESOB · Public Queue Display</h1>
            <p className="flex items-center gap-1 text-sm text-slate-300"><MapPin className="h-3.5 w-3.5" />{selected?.name || "Office not pinned"} · {selected?.office.administrative_level || ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg tabular-nums md:text-xl">{clock}</span>
          <button type="button" onClick={() => setConfigOpen((open) => !open)} className="rounded-xl bg-white/15 p-3 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-amber-300" aria-label="Configure TV location" title="Configure TV location"><Settings2 /></button>
          <button type="button" onClick={toggleSound} className="rounded-xl bg-white/15 p-3 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-amber-300" aria-label={sound ? "Disable announcements" : "Enable announcements"}>{sound ? <Volume2 /> : <VolumeX />}</button>
          <button type="button" onClick={() => void document.documentElement.requestFullscreen?.()} className="rounded-xl bg-white/15 p-3 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-amber-300" aria-label="Enter fullscreen"><Maximize2 /></button>
        </div>
      </header>
      {configOpen && (
        <section className="mb-3 rounded-xl border border-slate-600 bg-slate-900 p-4" aria-label="TV location setup">
          <h2 className="mb-3 text-lg font-semibold">TV Location</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="text-sm">Level
              <select className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 p-2" value={level} onChange={(e) => { setLevel(e.target.value as Level); setCityId(null); setSubcityId(null); setWoredaId(null); }}>
                <option value="city">City</option><option value="subcity">Subcity</option><option value="woreda">Woreda</option>
              </select>
            </label>
            <label className="text-sm">City
              <select className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 p-2" value={cityId ?? ""} onChange={(e) => { setCityId(e.target.value ? Number(e.target.value) : null); setSubcityId(null); setWoredaId(null); }}>
                <option value="">Select city</option>{locations?.cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
              </select>
            </label>
            {level !== "city" && <label className="text-sm">Subcity
              <select className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 p-2" value={subcityId ?? ""} disabled={!cityId} onChange={(e) => { setSubcityId(e.target.value ? Number(e.target.value) : null); setWoredaId(null); }}>
                <option value="">Select subcity</option>{availableSubcities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>}
            {level === "woreda" && <label className="text-sm">Woreda
              <select className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 p-2" value={woredaId ?? ""} disabled={!subcityId} onChange={(e) => setWoredaId(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Select woreda</option>{availableWoredas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>}
          </div>
          {locationError && <p role="alert" className="mt-2 text-red-300">{locationError}</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={pinOffice} disabled={!locations || officeId === null} className="rounded-lg bg-amber-300 px-4 py-2 font-semibold text-slate-950 disabled:opacity-50">Pin this TV</button>
            {selected && <button type="button" onClick={() => setConfigOpen(false)} className="rounded-lg border border-slate-600 px-4 py-2">Cancel</button>}
          </div>
        </section>
      )}
      {!selected ? (
        <div className="flex flex-1 items-center justify-center text-slate-300">{locationError || (locations ? "Select and pin this TV's location above." : "Loading locations…")}</div>
      ) : (
        <>
          {error && <p role="alert" className="mb-2 rounded-lg border border-red-400/50 p-2 text-red-200">{error}</p>}
          {audioError && <p role="alert" className="mb-2 rounded-lg border border-amber-300/50 p-2 text-amber-200">Recorded announcement unavailable: {audioError}</p>}
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-amber-300/15 px-3 py-1 font-semibold text-amber-300">Calling {data?.called.length ?? 0}</span>
              <span className="rounded-md bg-emerald-400/15 px-3 py-1 font-semibold text-emerald-300">Serving {data?.serving.length ?? 0}</span>
              <span className="rounded-md bg-white/10 px-3 py-1 font-semibold text-slate-200">Waiting {waitingCount}{waitingCount === 100 ? "+" : ""}</span>
            </div>
            {waitingPages > 1 && <span className="text-slate-400">{currentPage + 1}/{waitingPages}</span>}
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-700 bg-slate-900">
            <table className="w-full table-fixed border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-800 text-sm uppercase tracking-wide text-slate-200 md:text-base">
                <tr>
                  <th scope="col" className="w-[23%] px-3 py-3 md:px-6">Ticket</th>
                  <th scope="col" className="w-[16%] px-3 py-3 md:px-6">Counter</th>
                  <th scope="col" className="w-[36%] px-3 py-3 md:px-6">Service / Window</th>
                  <th scope="col" className="w-[25%] px-3 py-3 md:px-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ ticket, label, status }) => (
                  <tr key={ticket.id} className={`border-t border-slate-700/70 ${status === "called" ? "bg-amber-300/10" : status === "serving" ? "bg-emerald-400/10" : "bg-slate-900"}`}>
                    <td className={`px-3 py-2 font-black tabular-nums md:px-6 md:text-3xl ${status === "called" ? "text-amber-300" : status === "serving" ? "text-emerald-300" : "text-white"}`}>{ticket.ticket_number}</td>
                    <td className="px-3 py-2 text-lg font-bold md:px-6 md:text-2xl">{ticket.window_id}</td>
                    <td className="px-3 py-2 md:px-6"><div className="truncate text-sm font-semibold md:text-lg" title={ticket.window_title || ticket.window_name || ""}>{ticket.window_title || ticket.window_name || `Counter ${ticket.window_id}`}</div><div className="truncate text-xs text-slate-400 md:text-sm" title={ticket.service_name}>{ticket.service_name}</div></td>
                    <td className="px-3 py-2 md:px-6"><span className={`inline-block rounded-lg px-2 py-2 text-xs font-bold md:px-3 md:text-sm ${status === "called" ? "bg-amber-300 text-slate-950" : status === "serving" ? "bg-emerald-400 text-slate-950" : "bg-slate-700 text-slate-100"}`}>{label}</span></td>
                  </tr>
                ))}
                {!rows.length && <tr><td colSpan={4} className="px-6 py-16 text-center text-xl text-slate-400">{data ? "No active or waiting tickets for this office" : "Loading office queue…"}</td></tr>}
              </tbody>
            </table>
          </div>

        </>
      )}
    </main>
  );
}
