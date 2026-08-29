"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import {
  ArrowRight,
  Building2,
  Layers3,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import mesob from "@/app/mesob.jpg";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import {
  usePublicLocations,
  useWindowServices,
} from "@/hooks/public-service/use-public-service";

type Level = "city" | "subcity" | "woreda";

const ITEMS_PER_PAGE = 12;

const levels: Array<{ value: Level; label: string; description: string }> = [
  {
    value: "city",
    label: "City Level",
    description: "Apply for services available at city level.",
  },
  {
    value: "subcity",
    label: "Subcity Level",
    description: "Choose a subcity, then browse subcity services.",
  },
  {
    value: "woreda",
    label: "Woreda Level",
    description: "Choose subcity and woreda, then browse woreda services.",
  },
];

function queryFromSelection(selection: {
  administrative_level: Level;
  city_id?: number;
  subcity_id?: number;
  woreda_id?: number;
}) {
  const params = new URLSearchParams();

  params.set("administrative_level", selection.administrative_level);

  if (selection.city_id) params.set("city_id", String(selection.city_id));
  if (selection.subcity_id) params.set("subcity_id", String(selection.subcity_id));
  if (selection.woreda_id) params.set("woreda_id", String(selection.woreda_id));

  return params.toString();
}


function windowDisplayName(window: any, level?: Level | null) {
  if (!window) return "Service window";
  if (window.display_name) return window.display_name;

  const title =
      level === "city"
          ? window.city_title || window.title
          : level === "subcity"
              ? window.subcity_title || window.title
              : level === "woreda"
                  ? window.woreda_title || window.title
                  : window.title;

  const name = window.name || "Window";
  const isDuplicate =
      title && title.trim().toLowerCase() === name.trim().toLowerCase();

  return `${name}${title && !isDuplicate ? ` - ${title}` : ""}`;
}

function serviceWindowDisplayName(service: any, windows: any[], level?: Level | null) {
  if (service.window_display_name) return service.window_display_name;

  const window = windows.find((item: any) => Number(item.id) === Number(service.window_id));

  return windowDisplayName(window, level);
}


function normalizeWindows(data: any) {
  const value = data?.data;

  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;

  return [];
}

function PublicServicesPageContent() {
  const searchParams = useSearchParams();

  const [level, setLevel] = useState<Level | null>(null);
  const [cityId, setCityId] = useState<number | undefined>();
  const [subcityId, setSubcityId] = useState<number | undefined>();
  const [woredaId, setWoredaId] = useState<number | undefined>();

  const [search, setSearch] = useState("");
  const [selectedWindow, setSelectedWindow] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  // Seed the selection from the URL (e.g. /services?level=city) so the page
  // can be linked to directly and loads services without extra clicks.
  useEffect(() => {
    const levelParam = searchParams.get("level");

    if (levelParam === "city" || levelParam === "subcity" || levelParam === "woreda") {
      setLevel(levelParam);
    }

    const cityParam = searchParams.get("city_id");
    if (cityParam) setCityId(Number(cityParam));

    const subcityParam = searchParams.get("subcity_id");
    if (subcityParam) setSubcityId(Number(subcityParam));

    const woredaParam = searchParams.get("woreda_id");
    if (woredaParam) setWoredaId(Number(woredaParam));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: locationsData, isLoading: locationsLoading } = usePublicLocations();

  const cities = locationsData?.data?.cities || [];
  const subcities = locationsData?.data?.subcities || [];
  const woredas = locationsData?.data?.woredas || [];

  const selectedCityId = cityId || cities[0]?.id;

  const selection = useMemo(() => {
    if (!level) return {};

    return {
      administrative_level: level,
      city_id: selectedCityId,
      subcity_id: subcityId,
      woreda_id: woredaId,
    };
  }, [level, selectedCityId, subcityId, woredaId]);

  const readyToLoad =
      Boolean(level) &&
      Boolean(selectedCityId) &&
      (level !== "subcity" || Boolean(subcityId)) &&
      (level !== "woreda" || Boolean(subcityId && woredaId));

  const { data, isLoading, error } = useWindowServices(readyToLoad ? selection : {});

  const windows = normalizeWindows(data);

  const allServices = useMemo(() => {
    return windows.flatMap((window: any) =>
        (window.services || []).map((service: any) => ({
          ...service,
          window_id: window.id,
          window_name: window.name,
        }))
    );
  }, [windows]);

  const filteredSubcities = useMemo(() => {
    return subcities.filter((subcity: any) => Number(subcity.city_id) === Number(selectedCityId));
  }, [subcities, selectedCityId]);

  const filteredWoredas = useMemo(() => {
    return woredas.filter((woreda: any) => Number(woreda.subcity_id) === Number(subcityId));
  }, [woredas, subcityId]);

  const filteredServices = useMemo(() => {
    let services = selectedWindow
        ? allServices.filter((service: any) => Number(service.window_id) === Number(selectedWindow))
        : allServices;

    if (search.trim()) {
      const key = search.toLowerCase();

      services = services.filter((service: any) => {
        return (
            service.name?.toLowerCase().includes(key) ||
            service.description?.toLowerCase().includes(key)
        );
      });
    }

    return services;
  }, [selectedWindow, allServices, search]);

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / ITEMS_PER_PAGE));

  const paginatedServices = filteredServices.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE
  );

  const activeWindow = selectedWindow
      ? windows.find((window: any) => Number(window.id) === Number(selectedWindow))
      : null;

  const selectionQuery = readyToLoad ? queryFromSelection(selection as any) : "";

  useEffect(() => {
    setPage(1);
  }, [selectedWindow, search, level, cityId, subcityId, woredaId]);

  function handleLevelChange(nextLevel: Level) {
    setLevel(nextLevel);
    setSubcityId(undefined);
    setWoredaId(undefined);
    setSelectedWindow(null);
    setSearch("");
  }

  function handleCityChange(nextCityId: number) {
    setCityId(nextCityId);
    setSubcityId(undefined);
    setWoredaId(undefined);
    setSelectedWindow(null);
    setSearch("");
  }

  function handleSubcityChange(nextSubcityId: number) {
    setSubcityId(nextSubcityId);
    setWoredaId(undefined);
    setSelectedWindow(null);
    setSearch("");
  }

  function handleWoredaChange(nextWoredaId: number) {
    setWoredaId(nextWoredaId);
    setSelectedWindow(null);
    setSearch("");
  }

  return (
      <div className="min-h-screen bg-background">
        <section className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-4xl text-center">

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-sm">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
          Public Digital Services
        </span>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                Government Services
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                First choose the administrative level and location, then browse services by window.
              </p>

              {/* ✅ 3D PREMIUM STATS SECTION */}
              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3 [perspective:1000px]">

                {/* CARD 1 */}
                <div className="group relative overflow-hidden rounded-3xl border bg-card p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-2 hover:rotate-x-3 hover:shadow-[0_25px_60px_rgba(0,0,0,0.15)]">

                  {/* glass highlight */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-60" />

                  {/* soft divider glow */}
                  <div className="absolute inset-y-0 left-0 w-[4px] bg-primary/30 blur-[0.5px]" />

                  <div className="relative flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-black text-primary">
                        {allServices.length}
                      </h3>
                      <p className="text-sm text-muted-foreground">Services</p>
                    </div>

                    <div className="rounded-2xl bg-primary/10 p-3 text-primary shadow-inner transition-transform group-hover:scale-110">
                      <Layers3 className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="relative mt-4 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                    Total available government services
                  </div>
                </div>

                {/* CARD 2 */}
                <div className="group relative overflow-hidden rounded-3xl border bg-card p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-2 hover:rotate-x-3 hover:shadow-[0_25px_60px_rgba(0,0,0,0.15)]">

                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-60" />
                  <div className="absolute inset-y-0 left-0 w-[4px] bg-primary/30 blur-[0.5px]" />

                  <div className="relative flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-black text-primary">
                        {windows.length}
                      </h3>
                      <p className="text-sm text-muted-foreground">Windows</p>
                    </div>

                    <div className="rounded-2xl bg-primary/10 p-3 text-primary shadow-inner transition-transform group-hover:scale-110">
                      <Image src={mesob} alt="Mesob" width={40} height={40} />
                    </div>
                  </div>

                  <div className="relative mt-4 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                    Service delivery windows
                  </div>
                </div>

                {/* CARD 3 */}
                <div className="group relative overflow-hidden rounded-3xl border bg-card p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-2 hover:rotate-x-3 hover:shadow-[0_25px_60px_rgba(0,0,0,0.15)]">

                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-60" />
                  <div className="absolute inset-y-0 left-0 w-[4px] bg-primary/30 blur-[0.5px]" />

                  <div className="relative flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-black text-primary">24h</h3>
                      <p className="text-sm text-muted-foreground">Avg Response</p>
                    </div>

                    <div className="rounded-2xl bg-primary/10 p-3 text-primary shadow-inner transition-transform group-hover:scale-110">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="relative mt-4 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                    Average service processing time
                  </div>
                </div>

              </div>

              {/* SEARCH */}
              <div className="mx-auto mt-10 max-w-2xl">
                <div className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3 shadow-lg">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

                    <Input
                        placeholder="Search services..."
                        className="h-12 border-0 bg-transparent pl-11 shadow-none focus-visible:ring-0"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        disabled={!readyToLoad}
                    />
                  </div>

                  <Button className="h-12 rounded-2xl px-8" disabled={!readyToLoad}>
                    Search
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background py-8">
          <div className="container mx-auto space-y-6 px-4">
            <div className="grid gap-4 md:grid-cols-3">
              {levels.map((item) => (
                  <button
                      key={item.value}
                      type="button"
                      onClick={() => handleLevelChange(item.value)}
                      className={cn(
                          "rounded-3xl border bg-card p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md",
                          level === item.value
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border"
                      )}
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      {item.value === "city" ? (
                          <Building2 className="h-6 w-6" />
                      ) : (
                          <MapPin className="h-6 w-6" />
                      )}
                    </div>

                    <h3 className="font-bold">{item.label}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </button>
              ))}
            </div>

            {locationsLoading && (
                <Card className="rounded-3xl">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    Loading locations...
                  </CardContent>
                </Card>
            )}

            {level && (
                <Card className="rounded-3xl">
                  <CardContent className="grid gap-4 p-6 md:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium">City</label>
                      <select
                          className="mt-2 w-full rounded-md border bg-background p-3"
                          value={selectedCityId || ""}
                          onChange={(event) => handleCityChange(Number(event.target.value))}
                      >
                        {cities.map((city: any) => (
                            <option key={city.id} value={city.id}>
                              {city.name}
                            </option>
                        ))}
                      </select>
                    </div>

                    {(level === "subcity" || level === "woreda") && (
                        <div>
                          <label className="text-sm font-medium">Subcity</label>
                          <select
                              className="mt-2 w-full rounded-md border bg-background p-3"
                              value={subcityId || ""}
                              onChange={(event) => handleSubcityChange(Number(event.target.value))}
                          >
                            <option value="">Select Subcity</option>
                            {filteredSubcities.map((subcity: any) => (
                                <option key={subcity.id} value={subcity.id}>
                                  {subcity.name}
                                </option>
                            ))}
                          </select>
                        </div>
                    )}

                    {level === "woreda" && (
                        <div>
                          <label className="text-sm font-medium">Woreda</label>
                          <select
                              className="mt-2 w-full rounded-md border bg-background p-3"
                              value={woredaId || ""}
                              disabled={!subcityId}
                              onChange={(event) => handleWoredaChange(Number(event.target.value))}
                          >
                            <option value="">Select Woreda</option>
                            {filteredWoredas.map((woreda: any) => (
                                <option key={woreda.id} value={woreda.id}>
                                  {woreda.name}
                                </option>
                            ))}
                          </select>
                        </div>
                    )}
                  </CardContent>
                </Card>
            )}
          </div>
        </section>

        <section className="py-10">
          <div className="container mx-auto px-4">
            {!level && (
                <Card className="rounded-3xl">
                  <CardContent className="p-10 text-center text-muted-foreground">
                    Please choose City Level, Subcity Level, or Woreda Level first.
                  </CardContent>
                </Card>
            )}

            {level && !readyToLoad && (
                <Card className="rounded-3xl">
                  <CardContent className="p-10 text-center text-muted-foreground">
                    Please complete the required location selection to view services.
                  </CardContent>
                </Card>
            )}

            {readyToLoad && (
                <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
                  <aside>
                    <div className="sticky top-24 rounded-3xl border border-border bg-card shadow-sm">
                      <div className="border-b border-border p-5">
                        <div className="flex items-center gap-2">
                          <Image src={mesob} alt="Mesob" width={70} height={70} />

                          <div>
                            <h2 className="text-lg font-bold">Windows</h2>
                            <p className="text-xs text-muted-foreground">Browse by category</p>
                          </div>
                        </div>
                      </div>

                      <ScrollArea className="h-[650px]">
                        <div className="space-y-2 p-4">
                          <button
                              type="button"
                              onClick={() => setSelectedWindow(null)}
                              className={cn(
                                  "w-full rounded-2xl border p-4 text-left transition-all",
                                  !selectedWindow
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border hover:bg-muted"
                              )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="break-words font-semibold">All Services</p>
                                <p className="mt-1 text-xs opacity-70">View all</p>
                              </div>

                              <Badge
                                  className="shrink-0"
                                  variant={!selectedWindow ? "secondary" : "outline"}
                              >
                                {allServices.length}
                              </Badge>
                            </div>
                          </button>

                          {windows.map((window: any) => (
                              <button
                                  key={window.id}
                                  type="button"
                                  onClick={() => setSelectedWindow(window.id)}
                                  className={cn(
                                      "w-full rounded-2xl border p-4 text-left transition-all",
                                      selectedWindow === window.id
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-border hover:bg-muted"
                                  )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="break-words font-semibold leading-snug">
                                      {windowDisplayName(window, level)}
                                    </p>
                                    <p className="mt-1 text-xs opacity-70">Service window</p>
                                  </div>

                                  <Badge
                                      className="shrink-0"
                                      variant={selectedWindow === window.id ? "secondary" : "outline"}
                                  >
                                    {window.services?.length || 0}
                                  </Badge>
                                </div>
                              </button>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="border-t border-border p-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>Need help? Contact support</span>
                        </div>
                      </div>
                    </div>
                  </aside>

                  <main>
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-primary">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">Available Services</span>
                        </div>

                        <h2 className="mt-2 text-3xl font-black">
                          {selectedWindow ? activeWindow?.name : "All Services"}
                        </h2>

                        <p className="mt-1 text-muted-foreground">
                          {filteredServices.length} services available
                        </p>
                      </div>
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
                          Failed to load services
                        </div>
                    )}

                    {isLoading && (
                        <div className="py-20 text-center text-muted-foreground">
                          Loading services...
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {paginatedServices.map((service: any) => (
                          <Card
                              key={service.id}
                              className="group rounded-2xl border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                          >
                            <CardContent className="space-y-3 p-3">
                              <div>
                                <h3 className="line-clamp-1 text-sm font-semibold leading-5 text-foreground">
                                  {service.name}
                                </h3>

                                {!selectedWindow && service.window_name && (
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                      {serviceWindowDisplayName(service, windows, level)}
                                    </p>
                                )}
                              </div>

                              <p className="line-clamp-2 text-[11px] leading-5 text-muted-foreground">
                                {service.description || "Digital government service."}
                              </p>

                              <div className="flex items-center justify-between border-t pt-3">
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Service Fee</p>
                                  <p className="text-xs font-bold text-primary">
                                    {Number(service.service_fee || 0) > 0 ? `ETB ${service.service_fee}` : "Free"}
                                  </p>
                                </div>

                                <Link href={`/services/${service.id}?${selectionQuery}`}>
                                  <Button size="sm" className="h-8 rounded-xl text-xs">
                                    Details
                                    <ArrowRight className="ml-1 h-3 w-3" />
                                  </Button>
                                </Link>
                              </div>
                            </CardContent>
                          </Card>
                      ))}
                    </div>

                    {!isLoading && paginatedServices.length === 0 && (
                        <div className="rounded-3xl border border-dashed border-border bg-card py-20 text-center">
                          <p className="text-muted-foreground">No services found</p>

                          <Button
                              variant="outline"
                              className="mt-4"
                              onClick={() => {
                                setSearch("");
                                setSelectedWindow(null);
                              }}
                          >
                            Clear Filters
                          </Button>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="mt-10 flex items-center justify-center gap-2">
                          <Button
                              variant="outline"
                              disabled={page === 1}
                              onClick={() => setPage(page - 1)}
                          >
                            Previous
                          </Button>

                          {Array.from({ length: totalPages }).map((_, index) => (
                              <Button
                                  key={index}
                                  variant={page === index + 1 ? "default" : "outline"}
                                  size="icon"
                                  onClick={() => setPage(index + 1)}
                              >
                                {index + 1}
                              </Button>
                          ))}

                          <Button
                              variant="outline"
                              disabled={page === totalPages}
                              onClick={() => setPage(page + 1)}
                          >
                            Next
                          </Button>
                        </div>
                    )}
                  </main>
                </div>
            )}
          </div>
        </section>
      </div>
  );
}

export default function PublicServicesPage() {
  return (
      <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center text-muted-foreground">
              Loading services...
            </div>
          }
      >
        <PublicServicesPageContent />
      </Suspense>
  );
}