"use client";

import { useMemo, useState, type DragEvent } from "react";
import { Building2, CheckCircle2, ChevronDown, GripVertical, MapPin, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useSubcities } from "@/hooks/location/useSubcities";
import { useWoredas } from "@/hooks/location/useWoredas";

import {
  AssignmentLevel,
  OfficerType,
} from "@/services/user-services/user-service-assignment.service";

import {
  useAssignOfficerToService,
  useUnassignOfficerFromService,
  useUserServiceAssignmentBoard,
} from "@/hooks/user-services/use-user-service-assignment-board";

const cards: Array<{
  level: AssignmentLevel;
  title: string;
  description: string;
}> = [
  {
    level: "city",
    title: "City Service Assignment",
    description: "Assign city-level officers to city-level services.",
  },
  {
    level: "subcity",
    title: "Subcity Service Assignment",
    description: "Select subcity, then assign subcity officers to subcity services.",
  },
  {
    level: "woreda",
    title: "Woreda Service Assignment",
    description: "Select subcity and woreda, then assign woreda officers to woreda services.",
  },
];


function windowTitleForLevel(window: any, level: string) {
  if (!window) return "";
  if (window.display_name) return window.display_name;

  const title =
    level === "city"
      ? window.city_title || window.title
      : level === "subcity"
        ? window.subcity_title || window.title
        : level === "woreda"
          ? window.woreda_title || window.title
          : window.title;

  return `${window.name || "Window"}${title ? ` - ${title}` : ""}`;
}


function listFrom(value: any) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  return [];
}

export default function UserServicePage() {
  const [level, setLevel] = useState<AssignmentLevel>("city");
  const [search, setSearch] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<OfficerType>("front_officer");
  const [draggingOfficer, setDraggingOfficer] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [subcityId, setSubcityId] = useState<number | "">("");
  const [woredaId, setWoredaId] = useState<number | "">("");

  const { data: subcitiesRaw } = useSubcities();
  const { data: woredasRaw } = useWoredas();

  const subcities = listFrom(subcitiesRaw);
  const woredas = listFrom(woredasRaw);

  const readyToLoad =
    level === "city" ||
    (level === "subcity" && Boolean(subcityId)) ||
    (level === "woreda" && Boolean(subcityId) && Boolean(woredaId));

  const boardParams = {
    level,
    subcity_id: level === "subcity" || level === "woreda" ? subcityId || undefined : undefined,
    woreda_id: level === "woreda" ? woredaId || undefined : undefined,
  };

  const { data, isLoading } = useUserServiceAssignmentBoard(
    readyToLoad ? boardParams : { level }
  );

  const assignMutation = useAssignOfficerToService();
  const unassignMutation = useUnassignOfficerFromService();

  const filteredWoredas = useMemo(() => {
    return woredas.filter((woreda: any) => Number(woreda.subcity_id) === Number(subcityId));
  }, [woredas, subcityId]);

  const windows = readyToLoad ? data?.windows || [] : [];

  const allOfficers = useMemo(() => {
    return windows.flatMap((window: any) =>
      (window.officers || []).map((officer: any) => ({
        ...officer,
        window_id: window.id,
        window_name: windowTitleForLevel(window, level),
      }))
    );
  }, [windows]);

  const officerType = (officer: any): OfficerType => {
    const roles = [officer.role, ...(Array.isArray(officer.role_names) ? officer.role_names : [officer.role_names])]
      .filter(Boolean).join(" ").toLowerCase();
    return roles.includes("back") ? "back_officer" : "front_officer";
  };

  const availableOfficers = useMemo(() => {
    const key = search.trim().toLowerCase();
    return allOfficers.filter((officer: any) =>
      !key || [officer.name, officer.email, officer.phone, officer.window_name]
        .some((value) => String(value || "").toLowerCase().includes(key))
    );
  }, [allOfficers, search]);

  function onDragStart(event: DragEvent<HTMLElement>, officer: any) {
    const type = officerType(officer);
    event.dataTransfer.setData("application/x-mesob-officer", JSON.stringify({
      id: officer.id, window_id: officer.window_id, type,
    }));
    event.dataTransfer.effectAllowed = "move";
    setSelectedOfficer(officer);
    setSelectedType(type);
    setDraggingOfficer(`${officer.id}-${officer.window_id}`);
  }

  async function onDrop(event: DragEvent<HTMLElement>, service: any, window: any) {
    event.preventDefault();
    setDropTarget(null);
    setDraggingOfficer(null);
    let payload: { id: number; window_id: number; type: OfficerType };
    try {
      payload = JSON.parse(event.dataTransfer.getData("application/x-mesob-officer"));
    } catch {
      return;
    }
    const officer = allOfficers.find((item: any) =>
      Number(item.id) === Number(payload.id) &&
      Number(item.window_id) === Number(payload.window_id) &&
      officerType(item) === payload.type
    );
    if (!officer) {
      toast.error("The selected officer is no longer available.");
      return;
    }
    await assign(service, window, officer, payload.type);
  }

  async function assign(service: any, window: any, officer?: any, type?: OfficerType) {
    const assignmentType = type || (officer ? officerType(officer) : selectedType);
    const targetOfficer = officer || selectedOfficer;

    if (!readyToLoad) {
      toast.error("Please select the required location first.");
      return;
    }

    if (!targetOfficer) {
      toast.error("Select officer first.");
      return;
    }

    if (Number(targetOfficer.window_id) !== Number(window.id)) {
      toast.error("Officer and service must belong to the same window.");
      return;
    }

    if (assignmentType === "back_officer" && !service.has_back_officer) {
      toast.error("This service does not require a back officer.");
      return;
    }

    try {
      await assignMutation.mutateAsync({
        service_id: service.id,
        officer_id: targetOfficer.id,
        officer_type: assignmentType,
        window_id: window.id,
        level,
        subcity_id: level === "subcity" || level === "woreda" ? subcityId || undefined : undefined,
        woreda_id: level === "woreda" ? woredaId || undefined : undefined,
      });

      setSelectedOfficer(null);
      toast.success("Officer assigned to service.");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        Object.values(error?.response?.data?.errors || {})?.flat()?.[0] ||
        "Assignment failed";
      toast.error(String(msg));
    }
  }

  async function unassign(service: any, window: any, officer: any, type: OfficerType) {
    try {
      await unassignMutation.mutateAsync({
        service_id: service.id,
        officer_id: officer.id,
        officer_type: type,
        window_id: window.id,
        level,
        subcity_id: level === "subcity" || level === "woreda" ? subcityId || undefined : undefined,
        woreda_id: level === "woreda" ? woredaId || undefined : undefined,
      });

      toast.success("Officer removed from service.");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        Object.values(error?.response?.data?.errors || {})?.flat()?.[0] ||
        "Remove failed";
      toast.error(String(msg));
    }
  }

  function switchLevel(nextLevel: AssignmentLevel) {
    setLevel(nextLevel);
    setSearch("");
    setSelectedOfficer(null);
    setSelectedType("front_officer");
    setSubcityId("");
    setWoredaId("");
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-3 sm:space-y-6 sm:p-6">
      <div className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
        <h1 className="text-xl font-bold sm:text-2xl">User Service Assignment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select level and location, then assign front/back officers to services in the same window.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <button
            key={card.level}
            type="button"
            onClick={() => switchLevel(card.level)}
            className={`rounded-3xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-5 ${
              level === card.level ? "border-primary ring-2 ring-primary/20" : ""
            }`}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {card.level === "city" ? <Building2 className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
            </div>
            <h3 className="text-sm font-bold sm:text-base">{card.title}</h3>
            <p className="mt-2 text-xs text-muted-foreground sm:text-sm">{card.description}</p>
          </button>
        ))}
      </div>

      {(level === "subcity" || level === "woreda") && (
        <Card className="rounded-3xl">
          <CardContent className="grid gap-4 p-4 sm:p-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Subcity</label>
              <select
                className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
                value={subcityId}
                onChange={(event) => {
                  setSubcityId(event.target.value ? Number(event.target.value) : "");
                  setWoredaId("");
                  setSelectedOfficer(null);
                }}
              >
                <option value="">Select Subcity</option>
                {subcities.map((subcity: any) => (
                  <option key={subcity.id} value={subcity.id}>
                    {subcity.name}
                  </option>
                ))}
              </select>
            </div>

            {level === "woreda" && (
              <div>
                <label className="text-sm font-medium">Woreda</label>
                <select
                  className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
                  value={woredaId}
                  disabled={!subcityId}
                  onChange={(event) => {
                    setWoredaId(event.target.value ? Number(event.target.value) : "");
                    setSelectedOfficer(null);
                  }}
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

      {!readyToLoad && (
        <Card className="rounded-3xl">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {level === "subcity"
              ? "Please select a subcity to display subcity officers, windows, and services."
              : "Please select a subcity and woreda to display woreda officers, windows, and services."}
          </CardContent>
        </Card>
      )}

      {readyToLoad && (
        <>
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(290px,0.9fr)_minmax(0,1.5fr)]">
            <Card className="rounded-3xl lg:sticky lg:top-4">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div>
                  <h2 className="font-bold">Available Officers</h2>
                  <p className="text-sm text-muted-foreground">
                    Expand a group and drag an officer to a service in the same window, or select and assign.
                  </p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search officers or windows..."
                    aria-label="Search available officers"
                    className="pl-10"
                  />
                </div>
                <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
                  {(["front_officer", "back_officer"] as OfficerType[]).map((type) => {
                    const officers = availableOfficers.filter((officer: any) => officerType(officer) === type);
                    return (
                      <details key={type} className="group rounded-2xl border bg-background" open={type === "front_officer" ? true : undefined}>
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-2xl p-3 font-semibold [&::-webkit-details-marker]:hidden">
                          <span>{type === "front_officer" ? "Front Officers" : "Back Officers"}</span>
                          <span className="flex items-center gap-2">
                            <Badge variant="secondary">{officers.length}</Badge>
                            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                          </span>
                        </summary>
                        <div className="space-y-2 border-t p-2">
                          {officers.length ? officers.map((officer: any) => {
                            const active = selectedOfficer?.id === officer.id && selectedOfficer?.window_id === officer.window_id;
                            return (
                              <button
                                key={`${type}-${officer.id}-${officer.window_id}`}
                                type="button"
                                draggable={!assignMutation.isPending}
                                onDragStart={(event) => onDragStart(event, officer)}
                                onDragEnd={() => { setDraggingOfficer(null); setDropTarget(null); }}
                                onClick={() => { setSelectedOfficer(officer); setSelectedType(type); }}
                                aria-pressed={active}
                                className={`flex w-full items-start gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50 ${active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : ""} ${draggingOfficer === `${officer.id}-${officer.window_id}` ? "opacity-50" : ""}`}
                              >
                                <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold">{officer.name}</span>
                                  <span className="block truncate text-xs text-muted-foreground">{officer.email}</span>
                                  <Badge variant="outline" className="mt-2 max-w-full truncate text-xs">{officer.window_name}</Badge>
                                </span>
                                {active && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                              </button>
                            );
                          }) : <p className="p-3 text-xs text-muted-foreground">No officers in this group.</p>}
                        </div>
                      </details>
                    );
                  })}
                </div>
                {selectedOfficer && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Selected officer</p>
                      <p className="truncate text-sm font-semibold">{selectedOfficer.name}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setSelectedOfficer(null)}>Clear</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="min-w-0 space-y-3">
              <div className="px-1">
                <h2 className="font-bold">Services by Window</h2>
                <p className="text-sm text-muted-foreground">Expand a window to assign officers to its services.</p>
              </div>
              {isLoading ? (
                <Card className="rounded-3xl"><CardContent className="p-10 text-center text-muted-foreground">Loading...</CardContent></Card>
              ) : windows.length ? windows.map((window: any) => (
                <details key={window.id} className="group overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0">
                      <span className="block font-bold">{windowTitleForLevel(window, level)}</span>
                      <span className="text-xs text-muted-foreground">{(window.services || []).length} services · {(window.officers || []).length} officers</span>
                    </span>
                    <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-3 border-t p-3 sm:p-4">
                    {window.services?.length ? window.services.map((service: any) => {
                      const targetKey = `${window.id}-${service.id}`;
                      const selectedTypeForOfficer = selectedOfficer ? officerType(selectedOfficer) : selectedType;
                      const canAssign = Boolean(selectedOfficer) && Number(selectedOfficer.window_id) === Number(window.id) &&
                        (selectedTypeForOfficer !== "back_officer" || service.has_back_officer);
                      return (
                        <div
                          key={service.id}
                          onDragOver={(event) => {
                            if (Array.from(event.dataTransfer.types).includes("application/x-mesob-officer")) {
                              event.preventDefault();
                              event.dataTransfer.dropEffect = "move";
                              setDropTarget(targetKey);
                            }
                          }}
                          onDragLeave={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null);
                          }}
                          onDrop={(event) => void onDrop(event, service, window)}
                          className={`rounded-2xl border bg-background p-4 transition-colors ${dropTarget === targetKey ? "border-primary bg-primary/5 ring-2 ring-primary/20" : ""}`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold">{service.name}</h3>
                              <p className="text-xs text-muted-foreground">{service.has_back_officer ? "Front + Back Officers" : "Front Officers only"}</p>
                            </div>
                            <Button size="sm" disabled={!canAssign || assignMutation.isPending} onClick={() => assign(service, window, selectedOfficer, selectedTypeForOfficer)}>
                              {assignMutation.isPending ? "Assigning..." : "Assign Selected"}
                            </Button>
                          </div>
                          <div className="mt-3 rounded-xl border border-dashed p-3 text-center text-xs text-muted-foreground">
                            Drop an officer from this window here to assign
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <OfficerList title="Front Officers" officers={service.front_officers || []} disabled={unassignMutation.isPending} onRemove={(officer) => unassign(service, window, officer, "front_officer")} />
                            {service.has_back_officer && <OfficerList title="Back Officers" officers={service.back_officers || []} disabled={unassignMutation.isPending} onRemove={(officer) => unassign(service, window, officer, "back_officer")} />}
                          </div>
                        </div>
                      );
                    }) : <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No services assigned to this window.</div>}
                  </div>
                </details>
              )) : (
                <Card className="rounded-3xl"><CardContent className="p-10 text-center text-muted-foreground">No windows found for selected {level} location.</CardContent></Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function OfficerList({
  title,
  officers,
  onRemove,
  disabled = false,
}: {
  title: string;
  disabled?: boolean;
  officers: any[];
  onRemove: (officer: any) => void;
}) {
  return (
    <div className="rounded-xl border p-3">
      <p className="mb-2 text-sm font-semibold">{title}</p>
      {officers.length ? (
        <div className="space-y-2">
          {officers.map((officer) => (
            <div key={officer.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                <span className="text-sm">{officer.name}</span>
              </div>
              <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onRemove(officer)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No officer assigned.</p>
      )}
    </div>
  );
}
