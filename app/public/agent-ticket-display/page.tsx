"use client";

import { useEffect, useState } from "react";
import { Maximize2, Monitor, MapPin, Settings2 } from "lucide-react";

type Level = "city" | "subcity" | "woreda";
type Office = { administrative_level: Level; city_id: number; subcity_id: number | null; woreda_id: number | null };
type Ticket = { id: number; ticket_number: string; window_id: number; assigned_agents: string[] };
type QueueData = { location: Office; tickets: Ticket[] };
type ApiResponse = { success: boolean; message: string; data: QueueData };

const STORAGE_KEY = "mesob_agent_display_pinned_location_v1";
type City = { id: number; name: string };
type Subcity = { id: number; city_id: number; name: string };
type Woreda = { id: number; city_id: number | null; subcity_id: number; name: string };
type Locations = { cities: City[]; subcities: Subcity[]; woredas: Woreda[] };
type SavedPin = { level: Level; id: number; name: string; city_id: number; subcity_id: number | null; woreda_id: number | null };

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

export default function AgentTicketDisplayPage() {
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
  const [clock, setClock] = useState("");
  const [page, setPage] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(900);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/public/locations", { signal: controller.signal, cache: "no-store" });
        const payload = await response.json() as { success: boolean; message: string; data: Locations };
        if (!response.ok || !payload.success) throw new Error(payload.message || "Cannot load locations");
        setLocations(payload.data);
        const pinned = readOffice(payload.data);
        setSelected(pinned);
        if (pinned) {
          setLevel(pinned.office.administrative_level);
          setCityId(pinned.office.city_id);
          setSubcityId(pinned.office.subcity_id);
          setWoredaId(pinned.office.woreda_id);
        } else setConfigOpen(true);
      } catch (e) {
        if (!controller.signal.aborted) setLocationError(e instanceof Error ? e.message : "Cannot load locations");
      }
    })();
    const updateClock = () => setClock(new Date().toLocaleTimeString("en-GB"));
    const measure = () => setViewportHeight(window.innerHeight);
    updateClock(); measure();
    window.addEventListener("resize", measure);
    const timer = window.setInterval(updateClock, 1000);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener("resize", measure); };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let disposed = false;
    let busy = false;
    setData(null);
    const poll = async () => {
      if (busy || disposed) return;
      busy = true;
      try {
        const scope = selected.office;
        const params = new URLSearchParams({ administrative_level: scope.administrative_level, city_id: String(scope.city_id) });
        if (scope.subcity_id !== null) params.set("subcity_id", String(scope.subcity_id));
        if (scope.woreda_id !== null) params.set("woreda_id", String(scope.woreda_id));
        const response = await fetch(`/api/public/agent-ticket-display?${params.toString()}`, { cache: "no-store" });
        const payload = await response.json() as ApiResponse;
        if (!response.ok || !payload.success) throw new Error(payload.message || `HTTP ${response.status}`);
        if (!disposed) { setData(payload.data); setError(""); }
      } catch (e) {
        if (!disposed) setError(e instanceof Error ? e.message : "Display refresh failed");
      } finally { busy = false; }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 3000);
    return () => { disposed = true; window.clearInterval(timer); };
  }, [selected]);

  const officeId = level === "city" ? cityId : level === "subcity" ? subcityId : woredaId;
  const availableSubcities = locations?.subcities.filter((item) => item.city_id === cityId) ?? [];
  const availableWoredas = locations?.woredas.filter((item) => item.subcity_id === subcityId && (item.city_id === null || item.city_id === cityId)) ?? [];
  const pinOffice = () => {
    if (!locations || officeId === null) return;
    const pin = findLocation(locations, level, officeId);
    if (!pin || pin.city_id !== cityId || (level !== "city" && pin.subcity_id !== subcityId)) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pin));
      setSelected({ office: { administrative_level: pin.level, city_id: pin.city_id, subcity_id: pin.subcity_id, woreda_id: pin.woreda_id }, name: pin.name });
      setPage(0);
      setLocationError("");
      setConfigOpen(false);
    } catch { setLocationError("Unable to save this TV location."); }
  };

  const pageSize = Math.max(4, Math.floor((viewportHeight - 205) / 75));
  const tickets = data?.tickets ?? [];
  const pageCount = Math.max(1, Math.ceil(tickets.length / pageSize));
  const currentPage = page % pageCount;
  const visibleTickets = tickets.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  useEffect(() => {
    const timer = window.setInterval(() => setPage((previous) => previous + 1), 10000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 px-3 py-3 text-white md:h-screen md:overflow-hidden md:px-6">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
        <div className="flex items-center gap-3">
          <Monitor className="h-8 w-8 shrink-0 text-amber-300" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-bold md:text-3xl">MESOB · Agent Ticket Display</h1>
            <p className="flex items-center gap-1 text-sm text-slate-300"><MapPin className="h-3.5 w-3.5" />{selected?.name || "Office not pinned"} · {selected?.office.administrative_level || ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg tabular-nums md:text-xl">{clock}</span>
          <button type="button" onClick={() => setConfigOpen((open) => !open)} className="rounded-xl bg-white/15 p-3 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-amber-300" aria-label="Configure TV location"><Settings2 /></button>
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
          <div className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="rounded-md bg-white/10 px-3 py-1 font-semibold text-slate-200">Pending tickets: {tickets.length}</span>
            {pageCount > 1 && <span className="text-slate-400">Page {currentPage + 1}/{pageCount}</span>}
          </div>
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-700 bg-slate-900">
            <table className="w-full table-fixed border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-slate-800 text-sm uppercase tracking-wide text-slate-200 md:text-lg">
                <tr>
                  <th scope="col" className="w-[28%] px-3 py-4 md:px-6">Ticket Number</th>
                  <th scope="col" className="w-[20%] px-3 py-4 md:px-6">Window</th>
                  <th scope="col" className="w-[52%] px-3 py-4 md:px-6">Assigned Agent</th>
                </tr>
              </thead>
              <tbody>
                {visibleTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-t border-slate-700/70 bg-slate-900">
                    <td className="px-3 py-3 text-2xl font-black tabular-nums text-amber-300 md:px-6 md:text-4xl">{ticket.ticket_number}</td>
                    <td className="px-3 py-3 text-2xl font-bold md:px-6 md:text-3xl">{ticket.window_id}</td>
                    <td className="px-3 py-3 text-lg font-semibold md:px-6 md:text-2xl">{ticket.assigned_agents.join(", ")}</td>
                  </tr>
                ))}
                {!visibleTickets.length && <tr><td colSpan={3} className="px-6 py-16 text-center text-xl text-slate-400">{data ? "No tickets awaiting application submission" : "Loading agent tickets…"}</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
