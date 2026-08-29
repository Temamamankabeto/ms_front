"use client";

import { useMemo, useState } from "react";
import { Building2, CheckCircle2, MapPin, Search, UserCheck } from "lucide-react";
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

  const availableOfficers = useMemo(() => {
    const key = search.trim().toLowerCase();

    return allOfficers.filter((officer: any) => {
      const role = String(officer.role || officer.role_names?.[0] || "");

      const typeMatch =
        selectedType === "front_officer"
          ? role.includes("front")
          : role.includes("back");

      if (!typeMatch) return false;
      if (!key) return true;

      return (
        officer.name?.toLowerCase().includes(key) ||
        officer.email?.toLowerCase().includes(key) ||
        officer.phone?.toLowerCase().includes(key)
      );
    });
  }, [allOfficers, search, selectedType]);

  async function assign(service: any, window: any, officer?: any) {
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

    if (selectedType === "back_officer" && !service.has_back_officer) {
      toast.error("This service does not require a back officer.");
      return;
    }

    try {
      await assignMutation.mutateAsync({
        service_id: service.id,
        officer_id: targetOfficer.id,
        officer_type: selectedType,
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="rounded-3xl">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div>
                  <h2 className="font-bold">Available Officers</h2>
                  <p className="text-sm text-muted-foreground">
                    Showing officers under the selected {level} location and same assigned windows.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={selectedType === "front_officer" ? "default" : "outline"}
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      setSelectedType("front_officer");
                      setSelectedOfficer(null);
                    }}
                  >
                    Front Officers
                  </Button>

                  <Button
                    type="button"
                    variant={selectedType === "back_officer" ? "default" : "outline"}
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      setSelectedType("back_officer");
                      setSelectedOfficer(null);
                    }}
                  >
                    Back Officers
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search officers..."
                    className="pl-10"
                  />
                </div>

                <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                  {availableOfficers.length ? (
                    availableOfficers.map((officer: any) => {
                      const active = selectedOfficer?.id === officer.id;
                      return (
                        <button
                          key={`${officer.id}-${officer.window_id}`}
                          type="button"
                          onClick={() => setSelectedOfficer(officer)}
                          className={`w-full rounded-2xl border bg-background p-4 text-left ${
                            active ? "border-primary ring-2 ring-primary/20" : "hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold">{officer.name}</p>
                              <p className="text-xs text-muted-foreground">{officer.email}</p>
                              <Badge variant="outline" className="mt-2">
                                {officer.window_name}
                              </Badge>
                            </div>
                            {active && <CheckCircle2 className="h-5 w-5 text-primary" />}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      No available officers. Assign officers to windows for this location first.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedOfficer && (
              <Card className="rounded-3xl border-primary/30 bg-primary/5">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Selected Officer</p>
                    <p className="font-semibold">{selectedOfficer.name}</p>
                    <p className="text-xs text-muted-foreground">Window: {selectedOfficer.window_name}</p>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedOfficer(null)}>
                    Clear
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {isLoading ? (
            <Card className="rounded-3xl">
              <CardContent className="p-10 text-center text-muted-foreground">Loading...</CardContent>
            </Card>
          ) : windows.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {windows.map((window: any) => (
                <Card key={window.id} className="rounded-3xl">
                  <CardContent className="space-y-4 p-4 sm:p-5">
                    <div>
                      <h3 className="font-bold">{windowTitleForLevel(window, level)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {(window.services || []).length} service(s), {(window.officers || []).length} officer(s)
                      </p>
                    </div>

                    <div className="space-y-3">
                      {window.services?.length ? (
                        window.services.map((service: any) => (
                          <div key={service.id} className="rounded-2xl border bg-background p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <h4 className="font-semibold">{service.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {service.has_back_officer ? "Front + Back Officers" : "Front Officers only"}
                                </p>
                              </div>

                              <Button
                                size="sm"
                                disabled={!selectedOfficer || assignMutation.isPending}
                                onClick={() => assign(service, window)}
                              >
                                Assign Selected
                              </Button>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <OfficerList
                                title="Front Officers"
                                officers={service.front_officers || []}
                                onRemove={(officer) => unassign(service, window, officer, "front_officer")}
                              />

                              {service.has_back_officer && (
                                <OfficerList
                                  title="Back Officers"
                                  officers={service.back_officers || []}
                                  onRemove={(officer) => unassign(service, window, officer, "back_officer")}
                                />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                          No services assigned to this window.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="rounded-3xl">
              <CardContent className="p-10 text-center text-muted-foreground">
                No windows found for selected {level} location.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function OfficerList({
  title,
  officers,
  onRemove,
}: {
  title: string;
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
              <Button size="sm" variant="ghost" onClick={() => onRemove(officer)}>
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
