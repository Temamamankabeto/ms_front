"use client";

import { useMemo, useState } from "react";
import { Edit, MoreVertical, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  useCreateServiceCriterion,
  useDeleteServiceCriterion,
  useServiceCriteria,
  useUpdateServiceCriterion,
} from "@/hooks/service-criteria/use-service-criteria";
import { useDropdownServices, useServices } from "@/hooks/services/use-service";
import {
  ServiceCriterion,
  ServiceCriterionPayload,
} from "@/types/service-criteria/service-criteria";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  service_id: string;
  title: string;
  criteria: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  service_id: "",
  title: "Service Criteria",
  criteria: "",
  sort_order: "0",
  is_active: true,
};

function normalizeServices(response: any) {
  const value = response?.data ?? response;

  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;

  return [];
}

function criteriaLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function criterionToForm(item: ServiceCriterion): FormState {
  return {
    service_id: String(item.service_id || ""),
    title: item.title || "Service Criteria",
    criteria: item.criteria || "",
    sort_order: String(item.sort_order || 0),
    is_active: Boolean(item.is_active),
  };
}

function payloadFromForm(form: FormState): ServiceCriterionPayload {
  return {
    service_id: Number(form.service_id),
    title: form.title.trim(),
    criteria: criteriaLines(form.criteria).join("\n"),
    sort_order: Number(form.sort_order || 0),
    is_active: form.is_active,
  };
}

export default function ServiceCriteriaPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCriterion | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
const { data: servicesResponse } = useDropdownServices();
  const services = useMemo(() => normalizeServices(servicesResponse), [servicesResponse]);

  const { data, isLoading } = useServiceCriteria({
    page,
    search,
    service_id: serviceFilter === "all" ? undefined : serviceFilter,
    status: statusFilter,
  });

  const create = useCreateServiceCriterion();
  const update = useUpdateServiceCriterion();
  const remove = useDeleteServiceCriterion();

  const items = data?.data || [];
  const meta = data?.meta;

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(item: ServiceCriterion) {
    setEditing(item);
    setForm(criterionToForm(item));
    setOpen(true);
  }

  function closeDialog() {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function save() {
    if (!form.service_id) {
      toast.error("Select service");
      return;
    }

    if (!form.title.trim()) {
      toast.error("Enter title");
      return;
    }

    if (criteriaLines(form.criteria).length === 0) {
      toast.error("List at least one criterion");
      return;
    }

    try {
      const payload = payloadFromForm(form);

      if (editing) {
        await update.mutateAsync({ id: editing.id, payload });
        toast.success("Service criterion updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Service criterion created");
      }

      closeDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save service criterion");
    }
  }

  async function deleteCriterion(item: ServiceCriterion) {
    if (!confirm("Delete this service criterion?")) return;

    try {
      await remove.mutateAsync(item.id);
      toast.success("Service criterion deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete service criterion");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Service Criteria</h1>
            <p className="text-sm text-muted-foreground">
              Manage the criteria/checklist required for each service.
            </p>
          </div>

          <Button onClick={openCreate} className="rounded-2xl">
            <Plus className="mr-2 h-4 w-4" />
            Create Criteria
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_260px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Search criteria, title, or service..."
              className="pl-9"
            />
          </div>

          <Select
            value={serviceFilter}
            onValueChange={(value) => {
              setPage(1);
              setServiceFilter(value);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map((service: any) => (
                <SelectItem key={service.id} value={String(service.id)}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setPage(1);
              setStatusFilter(value as "all" | "active" | "inactive");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-4 text-left">#</th>
                <th className="p-4 text-left">Service</th>
                <th className="p-4 text-left">Title</th>
                <th className="p-4 text-left">Criteria</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Sort</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading service criteria...
                  </td>
                </tr>
              ) : items.length ? (
                items.map((item, index) => {
                  const lines = item.criteria_items?.length
                    ? item.criteria_items
                    : criteriaLines(item.criteria);

                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="p-4">{index + 1}</td>
                      <td className="p-4 font-medium">{item.service?.name || item.service_id}</td>
                      <td className="p-4">{item.title}</td>
                      <td className="p-4">
                        <ul className="max-w-xl list-disc space-y-1 pl-4 text-muted-foreground">
                          {lines.slice(0, 4).map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                          {lines.length > 4 && <li>+{lines.length - 4} more</li>}
                        </ul>
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}>
                          {item.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4">{item.sort_order}</td>
                      <td className="p-4 text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => deleteCriterion(item)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No service criteria found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-end gap-2 border-t p-4">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <Button
              variant="outline"
              disabled={page >= meta.last_page}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={(value) => (value ? setOpen(true) : closeDialog())}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Update Service Criteria" : "Create Service Criteria"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Service</Label>
              <Select
                value={form.service_id}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, service_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service: any) => (
                    <SelectItem key={service.id} value={String(service.id)}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Example: Required Documents"
              />
            </div>

            <div className="space-y-2">
              <Label>Criteria List</Label>
              <Textarea
                value={form.criteria}
                onChange={(event) =>
                  setForm((current) => ({ ...current, criteria: event.target.value }))
                }
                placeholder={`Write one criterion per line:\nValid ID card\nPassport size photo\nProof of payment`}
                className="min-h-48"
              />
              <p className="text-xs text-muted-foreground">
                Use one line for each criterion. The system stores the list exactly as written.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sort_order: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.is_active ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, is_active: value === "active" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                onClick={save}
                disabled={create.isPending || update.isPending}
              >
                {create.isPending || update.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
