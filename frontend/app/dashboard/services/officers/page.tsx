"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/common/Pagination";

import { useSubcities } from "@/hooks/location/useSubcities";
import { useWoredas } from "@/hooks/location/useWoredas";
import { useServiceOfficers } from "@/hooks/services/use-service";

type AssignmentLevel = "city" | "subcity" | "woreda";

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

function listFrom(value: any) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;
  return [];
}


function serviceWindowDisplayName(service: any) {
  return (
    service.window_display_name ||
    service.window_name ||
    service.window?.display_name ||
    service.window?.name ||
    (service.window_id ? `Window ID: ${service.window_id}` : "-")
  );
}


function roleLabel(role?: string) {
  if (!role) return "-";
  return role.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ServiceOfficersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState<AssignmentLevel>("city");
  const [role, setRole] = useState<"front_officer" | "back_officer" | "">("");
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

  const { data, isLoading } = useServiceOfficers({
    page,
    search,
    per_page: 10,
    level,
    role,
    subcity_id: level === "subcity" || level === "woreda" ? subcityId || undefined : undefined,
    woreda_id: level === "woreda" ? woredaId || undefined : undefined,
  });

  const officers = readyToLoad ? data?.data || [] : [];
  const meta = data?.meta;

  function switchLevel(nextLevel: AssignmentLevel) {
    setLevel(nextLevel);
    setSubcityId("");
    setWoredaId("");
    setSearch("");
    setRole("");
    setPage(1);
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
            className={`rounded-3xl border bg-card p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
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
              <label className="text-sm font-medium">Subcity</label>
              <select
                className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
                value={subcityId}
                onChange={(event) => {
                  setSubcityId(event.target.value ? Number(event.target.value) : "");
                  setWoredaId("");
                  setPage(1);
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
          )}

          {level === "woreda" && (
            <div>
              <label className="text-sm font-medium">Woreda</label>
              <select
                className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
                value={woredaId}
                disabled={!subcityId}
                onChange={(event) => {
                  setWoredaId(event.target.value ? Number(event.target.value) : "");
                  setPage(1);
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

          <div>
            <label className="text-sm font-medium">Officer Type</label>
            <select
              className="mt-2 w-full rounded-md border bg-background p-3 text-sm"
              value={role}
              onChange={(event) => {
                setRole(event.target.value as any);
                setPage(1);
              }}
            >
              <option value="">All Officers</option>
              <option value="front_officer">Front Officers</option>
              <option value="back_officer">Back Officers</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Search</label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search officers, email, phone, role, or service..."
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
              <div className="p-10 text-center text-muted-foreground">Loading...</div>
            ) : officers.length ? (
              <div className="space-y-4">
                {officers.map((officer: any, index: number) => (
                  <div key={officer.id} className="rounded-2xl border p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{officer.name}</h3>
                          <Badge>{roleLabel(officer.role || officer.roles?.[0]?.name)}</Badge>
                          <Badge variant="outline" className="capitalize">
                            {officer.location_level || level}
                          </Badge>
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {officer.email || "-"} · {officer.phone || "-"}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Location: {officer.woreda?.name || officer.subcity?.name || officer.city?.name || "-"}
                        </p>
                      </div>

                      <Button asChild size="sm">
                        <Link href="/dashboard/user-services">Manage Assignment</Link>
                      </Button>
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium">Assigned Services</p>

                      {officer.assigned_services?.length ? (
                        <div className="grid gap-2 md:grid-cols-2">
                          {officer.assigned_services.map((service: any) => (
                            <div key={`${officer.id}-${service.id}-${service.window_id}-${service.officer_type}`} className="rounded-xl border bg-muted/30 p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="font-medium">{service.name}</p>
                                <Badge variant={service.officer_type === "back_officer" ? "destructive" : "secondary"}>
                                  {roleLabel(service.officer_type)}
                                </Badge>
                              </div>

                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>Level: {service.assignment_level || "-"}</span>
                                <span>Window: {serviceWindowDisplayName(service)}</span>
                                <span>Status: {service.is_active ? "Active" : "Inactive"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                          No assigned services in this filter.
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {meta && (
                  <Pagination
                    currentPage={meta.current_page}
                    lastPage={meta.last_page}
                    onPageChange={setPage}
                  />
                )}
              </div>
            ) : (
              <div className="p-10 text-center text-muted-foreground">
                No officers found for this filter.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
