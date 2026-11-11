"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/common/Pagination";
import { useSubcities } from "@/hooks/location/useSubcities";
import { useWoredas } from "@/hooks/location/useWoredas";
import { useUserServiceAssignmentBoard } from "@/hooks/user-services/use-user-service-assignment-board";

type AssignmentLevel = "city" | "subcity" | "woreda";
type OfficerType = "front_officer" | "back_officer" | "";

type BoardOfficer = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  is_active?: boolean;
  city?: { name?: string } | null;
  subcity?: { name?: string } | null;
  woreda?: { name?: string } | null;
  pivot?: { is_active?: boolean } | null;
};

type BoardService = {
  id: number;
  name: string;
  has_back_officer?: boolean;
  front_officers?: BoardOfficer[];
  back_officers?: BoardOfficer[];
};

type BoardWindow = {
  id: number;
  name?: string;
  display_name?: string;
  name_am?: string;
  name_om?: string;
  name_or?: string;
  services?: BoardService[];
};

type ServiceRow = {
  key: string;
  name: string;
  windowName: string;
  front: BoardOfficer[];
  back: BoardOfficer[];
};

const PAGE_SIZE = 10;

const levelCards: Array<{
  level: AssignmentLevel;
  title: string;
  description: string;
}> = [
  {
    level: "city",
    title: "City Level",
    description: "City officers and city service assignments.",
  },
  {
    level: "subcity",
    title: "Subcity Level",
    description: "Filter by subcity to view subcity officer assignments.",
  },
  {
    level: "woreda",
    title: "Woreda Level",
    description: "Filter by subcity and woreda to view woreda assignments.",
  },
];

function listFrom(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  return [];
}

function windowTitle(window: BoardWindow, level: AssignmentLevel): string {
  // Prefer the same window display field used by the existing board where available.
  return (
    window.display_name ||
    (level === "city" ? window.name : undefined) ||
    window.name ||
    window.name_om ||
    window.name_or ||
    window.name_am ||
    `Window ${window.id}`
  );
}

function officerStatus(officer: BoardOfficer): string {
  if (typeof officer.pivot?.is_active === "boolean") {
    return officer.pivot.is_active ? "Active" : "Inactive";
  }
  if (typeof officer.is_active === "boolean") {
    return officer.is_active ? "Active" : "Inactive";
  }
  return officer.status || "—";
}

function officerMatches(officer: BoardOfficer, term: string): boolean {
  return [
    officer.name,
    officer.email,
    officer.phone,
    officer.status,
    officer.city?.name,
    officer.subcity?.name,
    officer.woreda?.name,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(term));
}

export default function ServiceOfficersPage() {
  const [page, setPage] = useState(1);
  const [expandedServices, setExpandedServices] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<AssignmentLevel>("city");
  const [role, setRole] = useState<OfficerType>("");
  const [subcityId, setSubcityId] = useState<number | "">("");
  const [woredaId, setWoredaId] = useState<number | "">("");

  const { data: subcitiesRaw } = useSubcities();
  const { data: woredasRaw } = useWoredas();
  const subcities = listFrom(subcitiesRaw);
  const woredas = listFrom(woredasRaw);

  const filteredWoredas = useMemo(
    () => woredas.filter((woreda: any) => Number(woreda.subcity_id) === Number(subcityId)),
    [woredas, subcityId],
  );

  const readyToLoad =
    level === "city" ||
    (level === "subcity" && Boolean(subcityId)) ||
    (level === "woreda" && Boolean(subcityId) && Boolean(woredaId));

  // The hook is unconditional, as required by React. Its result is not shown
  // until the selected administrative location is complete.
  const { data, isLoading, isError, error, refetch } = useUserServiceAssignmentBoard({
    level,
    subcity_id: readyToLoad && level !== "city" ? subcityId || undefined : undefined,
    woreda_id: readyToLoad && level === "woreda" ? woredaId || undefined : undefined,
  });

  const services = useMemo<ServiceRow[]>(() => {
    if (!readyToLoad) return [];
    const windows: BoardWindow[] = Array.isArray(data?.windows) ? data.windows : [];
    return windows.flatMap((window) =>
      (window.services || []).map((service) => ({
        key: `${window.id}:${service.id}`,
        name: service.name,
        windowName: windowTitle(window, level),
        front: service.front_officers || [],
        back: service.back_officers || [],
      })),
    ).sort((a, b) => a.name.localeCompare(b.name) || a.windowName.localeCompare(b.windowName));
  }, [data, level, readyToLoad]);

  const filteredServices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return services.reduce<ServiceRow[]>((rows, service) => {
      const serviceMatches = [service.name, service.windowName].some((value) =>
        value.toLowerCase().includes(term),
      );
      const front = role === "back_officer" ? [] : service.front;
      const back = role === "front_officer" ? [] : service.back;
      const matchingFront = term && !serviceMatches ? front.filter((officer) => officerMatches(officer, term)) : front;
      const matchingBack = term && !serviceMatches ? back.filter((officer) => officerMatches(officer, term)) : back;

      // Preserve service rows when filtering by officer type, even if no
      // officer of that type is assigned to a particular service.
      if (term && !serviceMatches && !matchingFront.length && !matchingBack.length) return rows;
      rows.push({ ...service, front: matchingFront, back: matchingBack });
      return rows;
    }, []);
  }, [services, search, role]);

  const lastPage = Math.max(1, Math.ceil(filteredServices.length / PAGE_SIZE));
  const currentPage = Math.min(page, lastPage);
  const visibleServices = filteredServices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleService(key: string) {
    setExpandedServices((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  function switchLevel(nextLevel: AssignmentLevel) {
    setLevel(nextLevel);
    setSubcityId("");
    setWoredaId("");
    setSearch("");
    setRole("");
    setPage(1);
    setExpandedServices([]);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-3 sm:p-6">
      <div className="rounded-3xl border bg-card p-5 shadow-sm">
        <h1 className="text-2xl font-bold">Service Officers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View officer-service assignments by city, subcity, and woreda level.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {levelCards.map((item) => (
          <button
            key={item.level}
            type="button"
            onClick={() => switchLevel(item.level)}
            aria-pressed={level === item.level}
            className={`rounded-3xl border bg-card p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
              level === item.level ? "border-primary ring-2 ring-primary/20" : ""
            }`}
          >
            <h3 className="font-bold">{item.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
          </button>
        ))}
      </div>

      <Card className="rounded-3xl">
        <CardContent className="grid gap-4 p-5 md:grid-cols-4">
          {(level === "subcity" || level === "woreda") && (
            <div>
              <label htmlFor="service-officers-subcity" className="text-sm font-medium">Subcity</label>
              <select
                id="service-officers-subcity"
                className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
                value={subcityId}
                onChange={(event) => {
                  setSubcityId(event.target.value ? Number(event.target.value) : "");
                  setWoredaId("");
                  setPage(1);
                  setExpandedServices([]);
                }}
              >
                <option value="">Select Subcity</option>
                {subcities.map((subcity: any) => (
                  <option key={subcity.id} value={subcity.id}>{subcity.name}</option>
                ))}
              </select>
            </div>
          )}

          {level === "woreda" && (
            <div>
              <label htmlFor="service-officers-woreda" className="text-sm font-medium">Woreda</label>
              <select
                id="service-officers-woreda"
                className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
                value={woredaId}
                disabled={!subcityId}
                onChange={(event) => {
                  setWoredaId(event.target.value ? Number(event.target.value) : "");
                  setPage(1);
                  setExpandedServices([]);
                }}
              >
                <option value="">Select Woreda</option>
                {filteredWoredas.map((woreda: any) => (
                  <option key={woreda.id} value={woreda.id}>{woreda.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="service-officers-type" className="text-sm font-medium">Officer Type</label>
            <select
              id="service-officers-type"
              className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
              value={role}
              onChange={(event) => {
                setRole(event.target.value as OfficerType);
                setPage(1);
              }}
            >
              <option value="">All Officers</option>
              <option value="front_officer">Front Officers</option>
              <option value="back_officer">Back Officers</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="service-officers-search" className="text-sm font-medium">Search</label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="service-officers-search"
                placeholder="Search officers, email, phone, or service..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!readyToLoad ? (
        <Card className="rounded-3xl">
          <CardContent className="p-10 text-center text-muted-foreground">
            {level === "subcity"
              ? "Please select a subcity to view subcity officer-service assignments."
              : "Please select a subcity and woreda to view woreda officer-service assignments."}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>
              {level.charAt(0).toUpperCase() + level.slice(1)} Officer Service Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-10 text-center text-muted-foreground" role="status">Loading services and assignments...</div>
            ) : isError ? (
              <div className="space-y-3 p-10 text-center" role="alert">
                <p className="font-medium">Unable to load service assignments.</p>
                <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : "Please try again."}</p>
                <Button type="button" variant="outline" onClick={() => void refetch()}>Retry</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    {filteredServices.length} of {services.length} services in the selected location
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/dashboard/user-services">Manage Assignment</Link>
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-[660px] text-left text-sm">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-4 py-3">Service</th>
                        <th scope="col" className="px-4 py-3">Window</th>
                        <th scope="col" className="px-4 py-3 text-center">Front Officers</th>
                        <th scope="col" className="px-4 py-3 text-center">Back Officers</th>
                        <th scope="col" className="px-4 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    {visibleServices.map((service) => {
                      const expanded = expandedServices.includes(service.key);
                      const detailId = `service-officers-${service.key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
                      return (
                        <tbody key={service.key} className="border-t">
                          <tr className="transition-colors hover:bg-muted/30">
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                aria-expanded={expanded}
                                aria-controls={detailId}
                                onClick={() => toggleService(service.key)}
                                className="flex w-full items-center gap-2 text-left font-medium focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                              >
                                {expanded ? <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" /> : <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
                                <span>{service.name}</span>
                              </button>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{service.windowName}</td>
                            <td className="px-4 py-3 text-center"><Badge variant="secondary">{service.front.length}</Badge></td>
                            <td className="px-4 py-3 text-center"><Badge variant="outline">{service.back.length}</Badge></td>
                            <td className="px-4 py-3 text-right font-semibold">{service.front.length + service.back.length}</td>
                          </tr>
                          {expanded && (
                            <tr id={detailId} className="bg-muted/10">
                              <td colSpan={5} className="px-4 py-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  {([
                                    { title: "Front Officers", entries: service.front },
                                    { title: "Back Officers", entries: service.back },
                                  ] as const).map((group) => (
                                    <div key={group.title} className="overflow-hidden rounded-xl border bg-card">
                                      <div className="border-b bg-muted/40 px-4 py-3 font-semibold">
                                        {group.title} <Badge variant="secondary" className="ml-2">{group.entries.length}</Badge>
                                      </div>
                                      {group.entries.length ? (
                                        <ul className="divide-y">
                                          {group.entries.map((officer) => (
                                            <li key={officer.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
                                              <div>
                                                <p className="font-medium">{officer.name}</p>
                                                <p className="text-xs text-muted-foreground">{officer.email || "-"} · {officer.phone || "-"}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                  {officer.woreda?.name || officer.subcity?.name || officer.city?.name || "-"}
                                                </p>
                                              </div>
                                              <Badge variant="outline">{officerStatus(officer)}</Badge>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="px-4 py-6 text-sm text-muted-foreground">No officers assigned.</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      );
                    })}
                  </table>
                  {!filteredServices.length && (
                    <p className="p-8 text-center text-sm text-muted-foreground">
                      {services.length ? "No services match your search." : "No services are assigned to windows at this location."}
                    </p>
                  )}
                </div>
                {lastPage > 1 && (
                  <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setPage} />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
