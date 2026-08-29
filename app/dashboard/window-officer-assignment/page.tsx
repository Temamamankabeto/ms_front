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
  OfficerWindowLevel,
} from "@/services/officer-window-assignment/officer-window-assignment.service";
import {
  useAssignOfficerToWindow,
  useOfficerWindowBoard,
  useUnassignOfficerFromWindow,
} from "@/hooks/officer-window-assignment/use-officer-window-assignment";

function listFrom(value: any) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  return [];
}

const cards: Array<{
  level: OfficerWindowLevel;
  title: string;
  description: string;
}> = [
  {
    level: "city",
    title: "City Window Officer Assignment",
    description: "Assign city-level officers to city-level windows.",
  },
  {
    level: "subcity",
    title: "Subcity Window Officer Assignment",
    description: "Assign subcity-level officers to subcity-level windows.",
  },
  {
    level: "woreda",
    title: "Woreda Window Officer Assignment",
    description: "Assign woreda-level officers to woreda-level windows.",
  },
];


function windowTitleForLevel(window: any, level: string) {
  if (!window) return "Window";
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

export default function WindowOfficerAssignmentPage() {
  const [level, setLevel] = useState<OfficerWindowLevel>("city");
  const [search, setSearch] = useState("");
  const [selectedOfficer, setSelectedOfficer] = useState<any>(null);
  const [subcityId, setSubcityId] = useState<number | "">("");
  const [woredaId, setWoredaId] = useState<number | "">("");

  const { data: subcitiesRaw } = useSubcities();
  const { data: woredasRaw } = useWoredas();

  const subcities = listFrom(subcitiesRaw);
  const woredas = listFrom(woredasRaw);

  const filteredWoredas = useMemo(() => {
    return woredas.filter((woreda: any) => Number(woreda.subcity_id) === Number(subcityId));
  }, [woredas, subcityId]);

  const readyToLoad =
      level === "city" ||
      (level === "subcity" && Boolean(subcityId)) ||
      (level === "woreda" && Boolean(subcityId) && Boolean(woredaId));

  const boardParams = {
    level,
    subcity_id: level === "subcity" || level === "woreda" ? subcityId || undefined : undefined,
    woreda_id: level === "woreda" ? woredaId || undefined : undefined,
  };

  const { data, isLoading } = useOfficerWindowBoard(readyToLoad ? boardParams : { level });
  const assignMutation = useAssignOfficerToWindow();
  const unassignMutation = useUnassignOfficerFromWindow();

  const windows = readyToLoad ? data?.windows || [] : [];
  const officers = readyToLoad ? data?.officers || data?.available_officers || [] : [];

  const filteredOfficers = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return officers;

    return officers.filter((officer: any) =>
        officer.name?.toLowerCase().includes(key) ||
        officer.email?.toLowerCase().includes(key) ||
        officer.phone?.toLowerCase().includes(key)
    );
  }, [officers, search]);

  async function assign(windowId: number, officerId?: number) {
    const targetOfficerId = officerId ?? selectedOfficer?.id;

    if (!readyToLoad) {
      toast.error("Please select the required location first.");
      return;
    }

    if (!targetOfficerId) {
      toast.error("Select officer first.");
      return;
    }

    try {
      await assignMutation.mutateAsync({
        officer_id: targetOfficerId,
        window_id: windowId,
        level,
        subcity_id: level === "subcity" || level === "woreda" ? subcityId || undefined : undefined,
        woreda_id: level === "woreda" ? woredaId || undefined : undefined,
      });
      setSelectedOfficer(null);
      toast.success("Officer assigned to window.");
    } catch (error: any) {
      const msg =
          error?.response?.data?.message ||
          Object.values(error?.response?.data?.errors || {})?.flat()?.[0] ||
          "Assignment failed";
      toast.error(String(msg));
    }
  }

  async function unassign(windowId: number, officerId: number) {
    try {
      await unassignMutation.mutateAsync({
        officer_id: officerId,
        window_id: windowId,
        level,
        subcity_id: level === "subcity" || level === "woreda" ? subcityId || undefined : undefined,
        woreda_id: level === "woreda" ? woredaId || undefined : undefined,
      });
      toast.success("Officer removed from window.");
    } catch (error: any) {
      const msg =
          error?.response?.data?.message ||
          Object.values(error?.response?.data?.errors || {})?.flat()?.[0] ||
          "Remove failed";
      toast.error(String(msg));
    }
  }

  function changeLevel(nextLevel: OfficerWindowLevel) {
    setLevel(nextLevel);
    setSelectedOfficer(null);
    setSearch("");
    setSubcityId("");
    setWoredaId("");
  }

  return (
      <div className="mx-auto w-full max-w-7xl space-y-4 p-3 sm:space-y-6 sm:p-6">
        <div className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
          <h1 className="text-xl font-bold sm:text-2xl">Officer Window Assignment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign front/back officers to windows by administrative level.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
              <button
                  key={card.level}
                  type="button"
                  onClick={() => changeLevel(card.level)}
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
                    ? "Please select a subcity to display subcity officers and windows."
                    : "Please select a subcity and woreda to display woreda officers and windows."}
              </CardContent>
            </Card>
        )}

        {selectedOfficer && (
            <div className="rounded-2xl border bg-primary/5 p-3 text-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Selected: <strong>{selectedOfficer.name}</strong>. Tap Assign on a window.
            </span>
                <Button size="sm" variant="outline" onClick={() => setSelectedOfficer(null)}>
                  Clear
                </Button>
              </div>
            </div>
        )}

        {!readyToLoad ? null : isLoading ? (
            <Card className="rounded-3xl">
              <CardContent className="p-10 text-center text-muted-foreground">Loading...</CardContent>
            </Card>
        ) : (
            <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
              <Card className="h-fit rounded-3xl">
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div>
                    <h2 className="font-bold">Available Officers</h2>
                    <p className="text-sm text-muted-foreground">
                      {filteredOfficers.length} unassigned {level} officer(s)
                    </p>
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

                  <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                    {filteredOfficers.length ? (
                        filteredOfficers.map((officer: any) => {
                          const active = selectedOfficer?.id === officer.id;

                          return (
                              <button
                                  key={officer.id}
                                  type="button"
                                  onClick={() => setSelectedOfficer(officer)}
                                  className={`w-full rounded-2xl border bg-background p-4 text-left transition ${
                                      active ? "border-primary ring-2 ring-primary/20" : "hover:bg-muted/40"
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-semibold">{officer.name}</p>
                                    <p className="text-xs text-muted-foreground">{officer.email}</p>
                                    <Badge variant="outline" className="mt-2 capitalize">
                                      {String(officer.role || "").replaceAll("_", " ")}
                                    </Badge>
                                  </div>
                                  {active && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                                </div>
                              </button>
                          );
                        })
                    ) : (
                        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                          No available officers
                        </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                {windows.length ? (
                    windows.map((window: any) => (
                        <Card key={window.id} className="rounded-3xl">
                          <CardContent className="space-y-4 p-4 sm:p-5">
                            <div>
                              <h3 className="font-bold">{windowTitleForLevel(window, level)}</h3>
                              <p className="text-sm text-muted-foreground">
                                {(window.officers || []).length} assigned officer(s)
                              </p>
                            </div>

                            <div className="space-y-2 rounded-2xl border border-dashed p-3">
                              <Button
                                  type="button"
                                  variant={selectedOfficer ? "default" : "outline"}
                                  className="w-full rounded-xl"
                                  disabled={!selectedOfficer || assignMutation.isPending}
                                  onClick={() => assign(window.id)}
                              >
                                Assign Selected Here
                              </Button>

                              {window.officers?.length ? (
                                  window.officers.map((officer: any) => (
                                      <div key={officer.id} className="rounded-xl border bg-background p-3">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <UserCheck className="h-4 w-4 text-primary" />
                                              <p className="font-medium">{officer.name}</p>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{officer.email}</p>
                                            <Badge variant="secondary" className="mt-2 capitalize">
                                              {String(officer.role || "").replaceAll("_", " ")}
                                            </Badge>
                                          </div>

                                          <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => unassign(window.id, officer.id)}
                                          >
                                            Remove
                                          </Button>
                                        </div>
                                      </div>
                                  ))
                              ) : (
                                  <div className="flex h-24 items-center justify-center text-center text-sm text-muted-foreground">
                                    No officer assigned
                                  </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="rounded-3xl md:col-span-2">
                      <CardContent className="p-10 text-center text-muted-foreground">
                        No {level} windows found.
                      </CardContent>
                    </Card>
                )}
              </div>
            </div>
        )}
      </div>
  );
}