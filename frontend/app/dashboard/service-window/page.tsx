"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  MapPin,
  MousePointerClick,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ServiceWindowBoardService,
  ServiceWindowLevel,
  useMoveServiceToWindow,
  useServiceWindowBoard,
  useUnassignServiceWindow,
} from "@/hooks/service-window/use-service-window";

const cards: Array<{
  level: ServiceWindowLevel;
  title: string;
  description: string;
}> = [
  {
    level: "city",
    title: "City Service Window Assignment",
    description: "Assign city-level services to city-level windows.",
  },
  {
    level: "subcity",
    title: "Subcity Service Window Assignment",
    description: "Assign subcity-level services to subcity-level windows.",
  },
  {
    level: "woreda",
    title: "Woreda Service Window Assignment",
    description: "Assign woreda-level services to woreda-level windows.",
  },
];

function windowTitleForLevel(window: any, level: string) {
  const base = window.name || `Window ${window.id}`;

  const subcity = window.subcity_name;
  const woreda = window.woreda_name;

  let title = base;

  if (
    level === "subcity" &&
    subcity &&
    subcity !== base &&
    !base.includes(subcity)
  ) {
    title = `${base} - ${subcity}`;
  }

  if (
    level === "woreda" &&
    woreda &&
    woreda !== base &&
    !base.includes(woreda)
  ) {
    title = `${base} - ${woreda}`;
  }

  return title;
}

export default function ServiceWindowPage() {
  const [level, setLevel] = useState<ServiceWindowLevel>("city");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [selectedService, setSelectedService] = useState<ServiceWindowBoardService | null>(null);

  const { data, isLoading } = useServiceWindowBoard({ level });
  const moveService = useMoveServiceToWindow();
  const unassignService = useUnassignServiceWindow();

  const services = data?.services || data?.unassigned_services || [];
  const windows = data?.windows || [];

  const filteredServices = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return services;
    return services.filter((service) => service.name.toLowerCase().includes(key));
  }, [services, search]);

  async function assignToWindow(windowId: number, serviceId?: number) {
    const targetServiceId = serviceId ?? selectedService?.id;

    if (!targetServiceId) {
      toast.error("Select a service first.");
      return;
    }

    try {
      await moveService.mutateAsync({
        service_id: targetServiceId,
        window_id: windowId,
        level,
        step_order: 1,
        is_required: true,
      });

      setSelectedService(null);
      toast.success("Service assigned successfully");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        Object.values(error?.response?.data?.errors || {})?.flat()?.[0] ||
        "Assignment failed";
      toast.error(String(msg));
    }
  }

  async function handleDrop(windowId: number, rawServiceId: string) {
    const serviceId = Number(rawServiceId);
    if (!serviceId) return;
    await assignToWindow(windowId, serviceId);
  }

  async function unassign(serviceId: number) {
    try {
      await unassignService.mutateAsync({ service_id: serviceId, level });
      toast.success("Service removed from this level only");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        Object.values(error?.response?.data?.errors || {})?.flat()?.[0] ||
        "Remove failed";
      toast.error(String(msg));
    }
  }

  function toggleWindow(id: number) {
    setCollapsed((current) => ({ ...current, [id]: !current[id] }));
  }

  function changeLevel(nextLevel: ServiceWindowLevel) {
    setLevel(nextLevel);
    setCollapsed({});
    setSelectedService(null);
    setSearch("");
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-3 sm:space-y-6 sm:p-6">
      <div className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
        <h1 className="text-xl font-bold sm:text-2xl">Service Window Assignment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a level, then drag on desktop or tap-select on mobile.
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

      {selectedService && (
        <div className="rounded-2xl border bg-primary/5 p-3 text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-primary" />
              <span>
                Selected: <strong>{selectedService.name}</strong>. Tap Assign on a window.
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSelectedService(null)}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Card className="rounded-3xl">
          <CardContent className="p-10 text-center text-muted-foreground">Loading board...</CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card className="h-fit rounded-3xl">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div>
                <h2 className="font-bold">Available Services</h2>
                <p className="text-sm text-muted-foreground">
                  {filteredServices.length} unassigned {level} service(s)
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search services..."
                  className="pl-10"
                />
              </div>

              <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1 lg:max-h-[70vh]">
                {filteredServices.length ? (
                  filteredServices.map((service) => {
                    const active = selectedService?.id === service.id;

                    return (
                      <button
                        key={service.id}
                        type="button"
                        draggable
                        onClick={() => setSelectedService(service)}
                        onDragStart={(event) => event.dataTransfer.setData("service_id", String(service.id))}
                        className={`w-full cursor-pointer rounded-2xl border bg-background p-4 text-left shadow-sm transition ${
                          active ? "border-primary ring-2 ring-primary/20" : "hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{service.name}</p>
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {service.description || "No description"}
                            </p>
                          </div>
                          {active && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No unassigned services
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {windows.length ? (
              windows.map((window) => {
                const isCollapsed = collapsed[window.id];

                return (
                  <Card
                    key={window.id}
                    className="rounded-3xl"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDrop(window.id, event.dataTransfer.getData("service_id"));
                    }}
                  >
                    <CardContent className="space-y-4 p-4 sm:p-5">
                      <button
                        type="button"
                        onClick={() => toggleWindow(window.id)}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <div>
                          <h3 className="font-bold">{windowTitleForLevel(window, level)}</h3>
                          <p className="text-sm text-muted-foreground">
                            {(window.services || []).length} assigned service(s)
                          </p>
                        </div>
                        {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>

                      {!isCollapsed && (
                        <div className="min-h-[130px] space-y-2 rounded-2xl border border-dashed p-3">
                          <Button
                            type="button"
                            variant={selectedService ? "default" : "outline"}
                            className="w-full rounded-xl"
                            disabled={!selectedService || moveService.isPending}
                            onClick={() => assignToWindow(window.id)}
                          >
                            Assign Selected Here
                          </Button>

                          {window.services?.length ? (
                            window.services.map((service) => (
                              <div
                                key={service.id}
                                draggable
                                onClick={() => setSelectedService(service)}
                                onDragStart={(event) => event.dataTransfer.setData("service_id", String(service.id))}
                                className="rounded-xl border bg-background p-3"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="font-medium">{service.name}</p>
                                    <p className="line-clamp-1 text-xs text-muted-foreground">
                                      {service.description || "No description"}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      unassign(service.id);
                                    }}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex h-24 items-center justify-center text-center text-sm text-muted-foreground">
                              Drop services here or tap Assign Selected Here
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
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
