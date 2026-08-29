"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ServiceWindowBoardService,
  ServiceWindowLevel,
  useMoveServiceToWindow,
  useServiceWindowBoard,
  useUnassignServiceWindow,
} from "@/hooks/service-window/use-service-window";

const levels: Array<{ level: ServiceWindowLevel; label: string }> = [
  { level: "city", label: "City Level" },
  { level: "subcity", label: "Subcity Level" },
  { level: "woreda", label: "Woreda Level" },
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

export default function AssignedServiceWindowListPage() {
  const [level, setLevel] = useState<ServiceWindowLevel>("city");
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [selectedService, setSelectedService] = useState<ServiceWindowBoardService | null>(null);

  const { data, isLoading } = useServiceWindowBoard({ level });
  const moveService = useMoveServiceToWindow();
  const unassignService = useUnassignServiceWindow();

  const windows = data?.windows || [];

  async function moveToWindow(windowId: number, serviceId?: number) {
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
      toast.success("Assignment updated for this level only");
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        Object.values(error?.response?.data?.errors || {})?.flat()?.[0] ||
        "Update failed";
      toast.error(String(msg));
    }
  }

  async function handleDrop(windowId: number, rawServiceId: string) {
    const serviceId = Number(rawServiceId);
    if (!serviceId) return;
    await moveToWindow(windowId, serviceId);
  }

  async function unassign(serviceId: number) {
    try {
      await unassignService.mutateAsync({ service_id: serviceId, level });
      toast.success("Assignment removed from this level only");
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
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-3 sm:space-y-6 sm:p-6">
      <div className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
        <h1 className="text-xl font-bold sm:text-2xl">Assigned Service Windows</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap a service, then tap Assign on another window. Desktop drag/drop also works.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {levels.map((item) => (
          <button
            key={item.level}
            type="button"
            onClick={() => changeLevel(item.level)}
            className={`rounded-3xl border bg-card p-4 text-left shadow-sm transition ${
              level === item.level ? "border-primary ring-2 ring-primary/20" : ""
            }`}
          >
            <h3 className="font-bold">{item.label}</h3>
            <p className="mt-2 text-sm text-muted-foreground">Manage {item.level}-level assignments</p>
          </button>
        ))}
      </div>

      {selectedService && (
        <div className="rounded-2xl border bg-primary/5 p-3 text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Selected: <strong>{selectedService.name}</strong>. Tap Assign on another window.
            </span>
            <Button size="sm" variant="outline" onClick={() => setSelectedService(null)}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Card className="rounded-3xl">
          <CardContent className="p-10 text-center text-muted-foreground">Loading...</CardContent>
        </Card>
      ) : windows.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {windows.map((window) => {
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
                      <p className="text-sm text-muted-foreground">{(window.services || []).length} service(s)</p>
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
                        onClick={() => moveToWindow(window.id)}
                      >
                        Assign Selected Here
                      </Button>

                      {window.services?.length ? (
                        window.services.map((service) => {
                          const active = selectedService?.id === service.id;

                          return (
                            <div
                              key={service.id}
                              draggable
                              onClick={() => setSelectedService(service)}
                              onDragStart={(event) => event.dataTransfer.setData("service_id", String(service.id))}
                              className={`rounded-xl border bg-background p-3 ${active ? "border-primary ring-2 ring-primary/20" : ""}`}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{service.name}</p>
                                    {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                  </div>
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
                          );
                        })
                      ) : (
                        <div className="flex h-24 items-center justify-center text-center text-sm text-muted-foreground">
                          Drop service here or tap Assign Selected Here
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-3xl">
          <CardContent className="p-10 text-center text-muted-foreground">
            No assigned services found for {level} level.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
