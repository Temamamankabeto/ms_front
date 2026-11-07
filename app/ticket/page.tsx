"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Loader2, MapPin, Pin, PinOff, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Level = "city" | "subcity" | "woreda";

type City = {
  id: number;
  name: string;
  code: string | null;
};

type Subcity = {
  id: number;
  city_id: number;
  name: string;
};

type Woreda = {
  id: number;
  city_id: number | null;
  subcity_id: number;
  name: string;
};

type Locations = {
  cities: City[];
  subcities: Subcity[];
  woredas: Woreda[];
};

type PinnedLocation = {
  level: Level;
  id: number;
  name: string;
  city_id: number;
  subcity_id: number | null;
  woreda_id: number | null;
};

type TicketService = {
  id: number;
  name: string;
};

type TicketWindow = {
  id: number;
  name: string;
  title: string | null;
  services_count: number;
  services: TicketService[];
};

type IssuedTicket = {
  id: number;
  ticket_number: string;
  request_id: string;
  window_id: number;
  window_name: string | null;
  service_id: number;
  service_name: string;
  administrative_level: Level;
  city_id: number;
  subcity_id: number | null;
  woreda_id: number | null;
  priority: string;
  status: string;
  created_at: string;
  officer_code?: string | null;
};

type PendingTicketRequest = {
  request_id: string;
  window_id: number;
  service_id: number;
  administrative_level: Level;
  city_id: number;
  subcity_id: number | null;
  woreda_id: number | null;
  priority: "normal";
};

type TicketStatistics = { total_tickets: number; today_tickets: number };

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

const API_BASE_URL = "/api";

async function readTicketApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      `Ticket service returned HTTP ${response.status} instead of JSON. ` +
      "Check the MESOB backend server and its Laravel logs."
    );
  }

  let result: ApiResponse<T>;
  try {
    result = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(`Invalid ticket service response (HTTP ${response.status}).`);
  }
  if (!result || typeof result.success !== "boolean") {
    throw new Error(`Unexpected ticket service response (HTTP ${response.status}).`);
  }
  return result;
}

const PIN_STORAGE_KEY = "mesob_ticket_pinned_location_v1";
const OLD_PIN_STORAGE_KEY = "mesob_ticket_pinned_level";

const levels: { id: Level; label: string }[] = [
  { id: "city", label: "City" },
  { id: "subcity", label: "Subcity" },
  { id: "woreda", label: "Woreda" },
];

function isPositiveId(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0;
}

function isLevel(value: unknown): value is Level {
  return value === "city" ||
    value === "subcity" ||
    value === "woreda";
}

function isPinnedLocation(value: unknown): value is PinnedLocation {
  if (!value || typeof value !== "object") return false;

  const item = value as Record<string, unknown>;

  return isLevel(item.level) &&
    isPositiveId(item.id) &&
    typeof item.name === "string" &&
    item.name.trim().length > 0 &&
    isPositiveId(item.city_id) &&
    (item.subcity_id === null || isPositiveId(item.subcity_id)) &&
    (item.woreda_id === null || isPositiveId(item.woreda_id)) &&
    (item.level !== "subcity" || item.subcity_id === item.id) &&
    (item.level !== "woreda" || item.woreda_id === item.id) &&
    (item.level !== "city" || item.city_id === item.id);
}

function findLocation(
  locations: Locations,
  level: Level,
  id: number
): PinnedLocation | null {
  if (level === "city") {
    const city = locations.cities.find((item) => item.id === id);

    return city
      ? {
          level,
          id: city.id,
          name: city.name,
          city_id: city.id,
          subcity_id: null,
          woreda_id: null,
        }
      : null;
  }

  if (level === "subcity") {
    const subcity = locations.subcities.find((item) => item.id === id);

    if (!subcity || !locations.cities.some((city) => city.id === subcity.city_id)) {
      return null;
    }

    return {
      level,
      id: subcity.id,
      name: subcity.name,
      city_id: subcity.city_id,
      subcity_id: subcity.id,
      woreda_id: null,
    };
  }

  const woreda = locations.woredas.find((item) => item.id === id);
  if (!woreda) return null;

  const subcity = locations.subcities.find(
    (item) => item.id === woreda.subcity_id
  );

  if (!subcity || !locations.cities.some((city) => city.id === subcity.city_id)) {
    return null;
  }

  if (woreda.city_id !== null && woreda.city_id !== subcity.city_id) {
    return null;
  }

  return {
    level,
    id: woreda.id,
    name: woreda.name,
    city_id: subcity.city_id,
    subcity_id: subcity.id,
    woreda_id: woreda.id,
  };
}

export default function TicketPage() {
  const [statistics, setStatistics] = useState<TicketStatistics | null>(null);
  const [serviceSearch, setServiceSearch] = useState("");
  const [locations, setLocations] = useState<Locations | null>(null);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);

  const [level, setLevel] = useState<Level | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedSubcityId, setSelectedSubcityId] = useState<number | null>(null);
  const [selectedWoredaId, setSelectedWoredaId] = useState<number | null>(null);
  const [pinnedLocation, setPinnedLocation] = useState<PinnedLocation | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  const [windows, setWindows] = useState<TicketWindow[]>([]);
  const [windowsLoading, setWindowsLoading] = useState(false);
  const [windowsError, setWindowsError] = useState<string | null>(null);
  const [selectedWindow, setSelectedWindow] = useState<TicketWindow | null>(null);
  const [issuedTicket, setIssuedTicket] = useState<IssuedTicket | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [processingServiceId, setProcessingServiceId] = useState<number | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const pendingTicketRef = useRef<PendingTicketRequest | null>(null);
  const ticketInFlightRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadStatistics() {
      try {
        const response = await fetch(`${API_BASE_URL}/public/ticket/statistics`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!response.ok) return;
        const result = await readTicketApiResponse<TicketStatistics>(response);
        if (result.success && !controller.signal.aborted) setStatistics(result.data);
      } catch {
        // Ticket issuing remains available if statistics are temporarily offline.
      }
    }

    void loadStatistics();
    const interval = window.setInterval(() => void loadStatistics(), 30000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLocations() {
      setLocationsLoading(true);
      setLocationsError(null);

      try {
        if (!API_BASE_URL) {
          throw new Error("MESOB API URL is not configured.");
        }

        const response = await fetch(`${API_BASE_URL}/public/locations`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
          cache: "no-store",
        });

        const result: ApiResponse<Locations> = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load locations.");
        }

        if (
          !result.data ||
          !Array.isArray(result.data.cities) ||
          !Array.isArray(result.data.subcities) ||
          !Array.isArray(result.data.woredas)
        ) {
          throw new Error("Invalid location response.");
        }

        if (!controller.signal.aborted) {
          setLocations(result.data);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setLocationsError(
            cause instanceof Error ? cause.message : "Unable to load locations."
          );
        }
      } finally {
        if (!controller.signal.aborted) setLocationsLoading(false);
      }
    }

    void loadLocations();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!locations) return;

    try {
      const saved = window.localStorage.getItem(PIN_STORAGE_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (isPinnedLocation(parsed)) {
          const current = findLocation(locations, parsed.level, parsed.id);

          if (current) {
            setPinnedLocation(current);
            setLevel(current.level);
            setSelectedCityId(current.city_id);
            setSelectedSubcityId(current.subcity_id);
            setSelectedWoredaId(current.woreda_id);

            window.localStorage.setItem(
              PIN_STORAGE_KEY,
              JSON.stringify(current)
            );
          } else {
            window.localStorage.removeItem(PIN_STORAGE_KEY);
          }
        } else {
          window.localStorage.removeItem(PIN_STORAGE_KEY);
        }
      }

      window.localStorage.removeItem(OLD_PIN_STORAGE_KEY);
    } catch {
      setStorageError("Browser storage is unavailable or contains invalid data.");
    } finally {
      setStorageLoaded(true);
    }
  }, [locations]);

  const subcities = useMemo(
    () => locations?.subcities.filter(
      (item) => item.city_id === selectedCityId
    ) ?? [],
    [locations, selectedCityId]
  );

  const woredas = useMemo(
    () => locations?.woredas.filter(
      (item) =>
        item.city_id === selectedCityId &&
        item.subcity_id === selectedSubcityId
    ) ?? [],
    [locations, selectedCityId, selectedSubcityId]
  );

  const selectedLocation = useMemo(() => {
    if (!locations || !level) return null;

    const id =
      level === "city"
        ? selectedCityId
        : level === "subcity"
          ? selectedSubcityId
          : selectedWoredaId;

    return id ? findLocation(locations, level, id) : null;
  }, [
    locations,
    level,
    selectedCityId,
    selectedSubcityId,
    selectedWoredaId,
  ]);

  function selectLevel(value: Level) {
    if (pinnedLocation) return;

    setLevel(value);
    setSelectedCityId(null);
    setSelectedSubcityId(null);
    setSelectedWoredaId(null);
    setSelectedWindow(null);
    setStorageError(null);
  }

  function pinLocation() {
    if (!selectedLocation || pinnedLocation) return;

    try {
      window.localStorage.setItem(
        PIN_STORAGE_KEY,
        JSON.stringify(selectedLocation)
      );
      window.localStorage.removeItem(OLD_PIN_STORAGE_KEY);
      setPinnedLocation(selectedLocation);
      setStorageError(null);
    } catch {
      setStorageError("Unable to save this location in browser storage.");
    }
  }

  function unpinLocation() {
    try {
      window.localStorage.removeItem(PIN_STORAGE_KEY);
      window.localStorage.removeItem(OLD_PIN_STORAGE_KEY);

      setPinnedLocation(null);
      setLevel(null);
      setSelectedCityId(null);
      setSelectedSubcityId(null);
      setSelectedWoredaId(null);
      setSelectedWindow(null);
      setStorageError(null);
    } catch {
      setStorageError("Unable to remove the pinned location.");
    }
  }

  useEffect(() => {
    if (!pinnedLocation) {
      setWindows([]);
      setWindowsError(null);
      setWindowsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadWindows() {
      setWindows([]);
      setSelectedWindow(null);
      setWindowsLoading(true);
      setWindowsError(null);

      try {
        if (!API_BASE_URL) {
          throw new Error("MESOB API URL is not configured.");
        }

        const location = pinnedLocation!;

        const params = new URLSearchParams({
          administrative_level: location.level,
          city_id: String(location.city_id),
        });

        if (location.subcity_id !== null) {
          params.set("subcity_id", String(location.subcity_id));
        }

        if (location.woreda_id !== null) {
          params.set("woreda_id", String(location.woreda_id));
        }

        const response = await fetch(
          `${API_BASE_URL}/public/ticket/windows?${params.toString()}`,
          {
            signal: controller.signal,
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
        );

        const result = await readTicketApiResponse<TicketWindow[]>(response);

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load service windows.");
        }

        if (!Array.isArray(result.data)) {
          throw new Error("Invalid service-window response.");
        }

        if (!controller.signal.aborted) {
          setWindows(result.data);
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setWindowsError(
            cause instanceof Error
              ? cause.message
              : "Unable to load service windows."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setWindowsLoading(false);
        }
      }
    }

    void loadWindows();

    return () => controller.abort();
  }, [pinnedLocation]);
  async function generateTicket(service: TicketService) {
    if (
      !API_BASE_URL ||
      !pinnedLocation ||
      !selectedWindow ||
      ticketInFlightRef.current ||
      issuedTicket
    ) {
      return;
    }

    const location = pinnedLocation;
    const windowId = selectedWindow.id;

    const previous = pendingTicketRef.current;
    const sameSelection =
      previous !== null &&
      previous.window_id === windowId &&
      previous.service_id === service.id &&
      previous.administrative_level === location.level &&
      previous.city_id === location.city_id &&
      previous.subcity_id === location.subcity_id &&
      previous.woreda_id === location.woreda_id;

    const payload: PendingTicketRequest =
      sameSelection && previous
        ? previous
        : {
            request_id: crypto.randomUUID(),
            window_id: windowId,
            service_id: service.id,
            administrative_level: location.level,
            city_id: location.city_id,
            subcity_id: location.subcity_id,
            woreda_id: location.woreda_id,
            priority: "normal",
          };

    pendingTicketRef.current = payload;
    ticketInFlightRef.current = true;
    setProcessingServiceId(service.id);
    setTicketLoading(true);
    setTicketError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/public/ticket/issue`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await readTicketApiResponse<IssuedTicket>(response);

      if (!response.ok || !result.success || !result.data?.ticket_number) {
        throw new Error(
          result.message ||
          `Unable to generate ticket (HTTP ${response.status}).`
        );
      }

      setIssuedTicket(result.data);
      pendingTicketRef.current = null;
      setSelectedWindow(null);
      setReceiptOpen(true);
    } catch (cause) {
      setTicketError(
        cause instanceof Error
          ? cause.message
          : "Unable to generate ticket. Please try again."
      );
    } finally {
      ticketInFlightRef.current = false;
      setTicketLoading(false);
      setProcessingServiceId(null);
    }
  }

  useEffect(() => {
    if (!receiptOpen || !issuedTicket) return;

    let active = true;
    let printStarted = false;
    let resetTimer: number | undefined;

    const finishPrinting = () => {
      if (!active || !printStarted) return;

      resetTimer = window.setTimeout(() => {
        if (!active) return;
        setReceiptOpen(false);
        setIssuedTicket(null);
        setTicketError(null);
        pendingTicketRef.current = null;
      }, 700);
    };

    const startTimer = window.setTimeout(() => {
      if (!active) return;

      printStarted = true;
      window.addEventListener("afterprint", finishPrinting, { once: true });

      window.print();
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(startTimer);
      if (resetTimer !== undefined) {
        window.clearTimeout(resetTimer);
      }
      window.removeEventListener("afterprint", finishPrinting);
    };
  }, [receiptOpen, issuedTicket]);

  const filteredServices = useMemo(() => {
    const query = serviceSearch.trim().toLocaleLowerCase();
    return selectedWindow?.services.filter((service) =>
      service.name.toLocaleLowerCase().includes(query)
    ) ?? [];
  }, [selectedWindow, serviceSearch]);

  function newTicket() {
    setReceiptOpen(false);
    setIssuedTicket(null);
    setTicketError(null);
    setSelectedWindow(null);
    pendingTicketRef.current = null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#3587d2] via-[#4b80bf] to-[#7d90c0] px-3 py-4 sm:px-5 sm:py-5">
      <div className="mx-auto max-w-[1800px] space-y-8">
        <header className="rounded-[26px] border border-white/70 bg-[#2d4b98] px-5 py-10 text-center text-white shadow-lg sm:py-12">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-white p-2 shadow-lg sm:h-32 sm:w-32">
            <img src="/mesob-kiosk-logo.png" alt="MESOB logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">MESOB Adaamaa</h1>
          <div className="mt-5 grid gap-3 rounded-lg bg-white px-5 py-5 text-slate-800 sm:grid-cols-2">
            <div>
              <p className="text-lg font-bold">Tikkeettii Hanga Amma</p>
              <p className="text-2xl font-extrabold" aria-live="polite">{statistics?.total_tickets.toLocaleString() ?? "—"}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-700">Tikkeettii Guyyaa Har’aa</p>
              <p className="text-2xl font-extrabold" aria-live="polite">{statistics?.today_tickets.toLocaleString() ?? "—"}</p>
            </div>
          </div>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            {pinnedLocation ? "Pinned Location" : "1. Select Administrative Level"}
          </h2>

          {locationsLoading && (
            <div role="status" className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading locations...
            </div>
          )}

          {locationsError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {locationsError}
            </div>
          )}

          {storageError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {storageError}
            </div>
          )}

          {storageLoaded && pinnedLocation ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-center gap-3">
                <Pin className="h-6 w-6 text-blue-700" />
                <div>
                  <p className="font-semibold text-slate-900">
                    {pinnedLocation.name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {levels.find((item) => item.id === pinnedLocation.level)?.label}
                    Pinned in this browser
                  </p>
                </div>
              </div>

              <Button type="button" variant="outline" onClick={unpinLocation}>
                <PinOff className="mr-2 h-4 w-4" />
                Unpin Location
              </Button>
            </div>
          ) : (
            storageLoaded && locations && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  {levels.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectLevel(item.id)}
                      aria-pressed={level === item.id}
                      className={`rounded-xl border-2 bg-white p-6 text-left shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${
                        level === item.id
                          ? "border-blue-700"
                          : "border-slate-200 hover:border-blue-400"
                      }`}
                    >
                      {item.id === "city" ? (
                        <Building2 className="mb-3 h-8 w-8" />
                      ) : (
                        <MapPin className="mb-3 h-8 w-8" />
                      )}

                      <span className="text-lg font-semibold">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>

                {level && (
                  <div className="space-y-4 rounded-xl border bg-white p-5">
                    <h3 className="font-semibold">Select Specific Location</h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="ticket-city" className="text-sm font-medium">
                          City
                        </label>
                        <select
                          id="ticket-city"
                          value={selectedCityId ?? ""}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setSelectedCityId(value || null);
                            setSelectedSubcityId(null);
                            setSelectedWoredaId(null);
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3"
                        >
                          <option value="">Select City</option>
                          {locations.cities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {(level === "subcity" || level === "woreda") && (
                        <div className="space-y-2">
                          <label htmlFor="ticket-subcity" className="text-sm font-medium">
                            Subcity
                          </label>
                          <select
                            id="ticket-subcity"
                            value={selectedSubcityId ?? ""}
                            disabled={!selectedCityId}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              setSelectedSubcityId(value || null);
                              setSelectedWoredaId(null);
                            }}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 disabled:bg-slate-100"
                          >
                            <option value="">Select Subcity</option>
                            {subcities.map((subcity) => (
                              <option key={subcity.id} value={subcity.id}>
                                {subcity.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {level === "woreda" && (
                        <div className="space-y-2">
                          <label htmlFor="ticket-woreda" className="text-sm font-medium">
                            Woreda
                          </label>
                          <select
                            id="ticket-woreda"
                            value={selectedWoredaId ?? ""}
                            disabled={!selectedSubcityId}
                            onChange={(event) => {
                              const value = Number(event.target.value);
                              setSelectedWoredaId(value || null);
                            }}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 disabled:bg-slate-100"
                          >
                            <option value="">Select Woreda</option>
                            {woredas.map((woreda) => (
                              <option key={woreda.id} value={woreda.id}>
                                {woreda.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={pinLocation}
                      disabled={!selectedLocation}
                    >
                      <Pin className="mr-2 h-4 w-4" />
                      Pin Location
                    </Button>
                  </div>
                )}
              </>
            )
          )}
        </section>

        {storageLoaded && pinnedLocation && (
          <section className="space-y-5">
            <h2 className="text-xl font-semibold">
              Tajaajiloota
            </h2>

            {windowsLoading && (
              <div role="status" className="flex items-center gap-2 rounded-lg border bg-white p-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading service windows...
              </div>
            )}

            {windowsError && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                {windowsError}
              </div>
            )}

            {!windowsLoading && !windowsError && windows.length === 0 && (
              <p className="rounded-lg border bg-white p-5 text-slate-600">
                No service windows are currently assigned to this location.
              </p>
            )}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {windows.map((window) => (
                <button
                  key={window.id}
                  type="button"
                  onClick={() => { setServiceSearch(""); setSelectedWindow(window); }}
                  className="group flex min-h-44 items-center gap-5 rounded-[22px] border border-white/65 bg-[#2d4b98] p-6 text-left text-white shadow-md transition hover:bg-[#365baa] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 active:scale-[0.99]"
                >
                  <img
                    src="/mesob-kiosk-logo.png"
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    width={80}
                    height={80}
                    className="h-20 w-20 shrink-0 object-contain"
                  />
                  <div>
                    <h3 className="text-xl font-extrabold leading-snug sm:text-2xl">{window.name}</h3>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {ticketError && !selectedWindow && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {ticketError}
          </div>
        )}

        <Dialog
          open={receiptOpen && issuedTicket !== null}
          onOpenChange={(open) => {
            if (!open) {
              setReceiptOpen(false);
              newTicket();
            }
          }}
        >
          <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                Adama Masob
              </DialogTitle>
              <DialogDescription className="text-center">
                Queue Ticket
              </DialogDescription>
            </DialogHeader>

            {issuedTicket && (
              <div className="space-y-4">
                <div className="rounded-xl border bg-slate-50 p-6 text-center">
                  <p className="text-sm text-slate-600">Your Ticket Number</p>
                  <p className="mt-2 text-5xl font-bold tracking-wide text-blue-800">
                    {issuedTicket.ticket_number}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <p><strong>Service:</strong> {issuedTicket.service_name}</p>
                  <p><strong>Window:</strong> {issuedTicket.window_name}</p>
                  <p><strong>Officer Code:</strong> {issuedTicket.officer_code?.trim() || "Not assigned"}</p>
                  <p><strong>Date:</strong> {new Date(issuedTicket.created_at).toLocaleString()}</p>
                </div>

                <p className="border-t pt-3 text-center text-xs text-slate-600">
                  Please wait until your ticket number is called.
                </p>

                <p className="text-center text-base font-bold text-slate-900">Free Call: 4191</p>
                <p className="text-center text-xs text-slate-500">
                  Printing starts automatically.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {receiptOpen && issuedTicket && (
          <section id="mesob-print-ticket" aria-label="Printable queue ticket">
            <div className="ticket-brand" style={{ textAlign: "center", marginBottom: "10px" }}>
              <strong>Adama Masob</strong>
              <div>Queue Ticket</div>
            </div>
            <div className="ticket-number-box">
              <div>Your Ticket Number</div>
              <strong>{issuedTicket.ticket_number}</strong>
            </div>

            <div className="ticket-details">
              <p><strong>Service:</strong> {issuedTicket.service_name}</p>
              <p><strong>Window:</strong> {issuedTicket.window_name}</p>
              <p><strong>Officer Code:</strong> {issuedTicket.officer_code?.trim() || "Not assigned"}</p>
              <p><strong>Date:</strong> {new Date(issuedTicket.created_at).toLocaleString()}</p>
            </div>

            <p className="ticket-footer">
              Please wait until your ticket number is called.
            </p>
            <p className="ticket-free-call">Free Call: 4191</p>
          </section>
        )}
        {issuedTicket && !receiptOpen && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="font-semibold">
              Ticket {issuedTicket.ticket_number} generated successfully.
            </p>
            <Button
              type="button"
              className="mt-3"
              onClick={() => setReceiptOpen(true)}
            >
              View Ticket
            </Button>
          </div>
        )}

        <Dialog
          open={selectedWindow !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedWindow(null);
          }}
        >
          <DialogContent className="flex max-h-[88dvh] w-[calc(100vw-2rem)] max-w-3xl flex-col overflow-hidden border-0 bg-[#f3f4f6] p-0 text-[#2e394c] shadow-2xl sm:rounded-[28px]">
            <DialogHeader className="shrink-0 border-b border-slate-200 px-6 py-6 pr-14 text-left sm:px-9 sm:py-8">
              <DialogTitle className="text-2xl font-extrabold tracking-tight text-[#2e394c] sm:text-3xl">
                Tajaajiloota Filadhaa
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-slate-600">
                {selectedWindow?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="shrink-0 px-6 pb-3 pt-6 sm:px-9">
              <label htmlFor="mesob-service-search" className="sr-only">Search services</label>
              <input
                id="mesob-service-search"
                type="search"
                value={serviceSearch}
                onChange={(event) => setServiceSearch(event.target.value)}
                placeholder="Search services..."
                className="w-full rounded-2xl border border-[#d6deec] bg-white px-5 py-4 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#304f98]"
              />
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-6 pt-3 sm:px-9">
              {ticketError && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {ticketError}
                </div>
              )}

              {filteredServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  className="block w-full min-h-36 rounded-[24px] bg-[#304e98] px-7 py-7 text-left text-white shadow-md transition hover:bg-[#3a5eac] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-40 sm:px-9"
                  disabled={ticketLoading || issuedTicket !== null}
                  onClick={() => void generateTicket(service)}
                >
                  <span className="block text-lg font-bold leading-snug sm:text-2xl">
                    {service.name}
                  </span>
                  {ticketLoading && processingServiceId === service.id && (
                    <span role="status" className="mt-3 block text-sm text-white/90">
                      Processing ticket...
                    </span>
                  )}
                </button>
              ))}

              {selectedWindow?.services.length === 0 && (
                <p className="py-6 text-center text-slate-600">
                  No services are assigned to this window.
                </p>
              )}
              {(selectedWindow?.services.length ?? 0) > 0 && filteredServices.length === 0 && (
                <p className="py-6 text-center text-slate-600" role="status">
                  No services match your search.
                </p>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-[#f3f4f6] px-6 py-4 sm:px-9">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setSelectedWindow(null)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}