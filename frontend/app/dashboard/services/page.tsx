"use client";

import { useMemo, useState } from "react";
import { MoreVertical, Search } from "lucide-react";

import {
  useCreateService,
  useDeleteService,
  useServices,
  useUpdateService,
} from "@/hooks/services/use-service";

import {
  Service,
  ServiceAvailability,
} from "@/types/services/service";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  name: string;
  description: string;
  has_back_officer: boolean;
  service_fee: number;
  availability: ServiceAvailability[];
  status: "active" | "inactive";
};

type LevelFilter = "all" | ServiceAvailability;

const SERVICE_LEVELS: ServiceAvailability[] = ["city", "subcity", "woreda"];

const emptyForm: FormState = {
  name: "",
  description: "",
  has_back_officer: false,
  service_fee: 0,
  availability: [],
  status: "active",
};

function normalizeAvailability(value: unknown): ServiceAvailability[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).toLowerCase())
      .filter((item): item is ServiceAvailability =>
        SERVICE_LEVELS.includes(item as ServiceAvailability)
      );
  }

  if (typeof value === "string") {
    try {
      return normalizeAvailability(JSON.parse(value));
    } catch {
      return SERVICE_LEVELS.includes(value as ServiceAvailability)
        ? [value as ServiceAvailability]
        : [];
    }
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (Array.isArray(record.levels)) {
      return normalizeAvailability(record.levels);
    }

    if (Array.isArray(record.administrative_levels)) {
      return normalizeAvailability(record.administrative_levels);
    }

    return SERVICE_LEVELS.filter((level) => Boolean(record[level]));
  }

  return [];
}

function serviceToForm(service: Service): FormState {
  return {
    name: service.name || "",
    description: service.description || "",
    has_back_officer: Boolean(service.has_back_officer),
    service_fee: Number(service.service_fee || 0),
    availability: normalizeAvailability(service.availability),
    status: service.status || "active",
  };
}

function levelLabel(level: string) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/*
|--------------------------------------------------------------------------
| Stable dialog form
|--------------------------------------------------------------------------
| Keep this component outside the page component. This prevents input remounts
| and keeps typing/focus stable in both create and edit dialogs.
*/
function ServiceDialogForm({
  formData,
  setFormData,
  submitLabel,
  loading,
  onSubmit,
  onCancel,
}: {
  formData: FormState;
  setFormData: React.Dispatch<React.SetStateAction<FormState>>;
  submitLabel: string;
  loading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  function toggleLevel(level: ServiceAvailability, checked: boolean) {
    setFormData((current) => {
      if (checked) {
        return {
          ...current,
          availability: Array.from(new Set([...current.availability, level])),
        };
      }

      return {
        ...current,
        availability: current.availability.filter((item) => item !== level),
      };
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="service-name">Name</Label>
        <Input
          id="service-name"
          autoComplete="off"
          value={formData.name}
          placeholder="Enter service name"
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="service-description">Description</Label>
        <Textarea
          id="service-description"
          value={formData.description}
          placeholder="Enter service description"
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="service-fee">Service Fee</Label>
        <Input
          id="service-fee"
          type="number"
          min={0}
          step="0.01"
          value={String(formData.service_fee)}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              service_fee: Number(event.target.value || 0),
            }))
          }
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-3">
        <Checkbox
          checked={formData.has_back_officer}
          onCheckedChange={(checked) =>
            setFormData((current) => ({
              ...current,
              has_back_officer: Boolean(checked),
            }))
          }
        />
        <span className="text-sm font-medium">Has Back Officer</span>
      </label>

      <div className="space-y-3">
        <Label>Availability Level</Label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {SERVICE_LEVELS.map((level) => (
            <label
              key={level}
              className="flex cursor-pointer items-center gap-2 rounded-xl border p-3 transition hover:bg-muted"
            >
              <Checkbox
                checked={formData.availability.includes(level)}
                onCheckedChange={(checked) => toggleLevel(level, Boolean(checked))}
              />
              <span className="text-sm font-medium capitalize">{level}</span>
            </label>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Select where this service is available: city, subcity, woreda, or multiple levels.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) =>
            setFormData((current) => ({
              ...current,
              status: value as "active" | "inactive",
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <Button
          type="button"
          disabled={
            loading ||
            !formData.name.trim() ||
            formData.availability.length === 0
          }
          onClick={onSubmit}
        >
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}

export default function ServicePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);

  const { data, isLoading } = useServices(page);
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();

  const services = useMemo(() => {
    const paginator = data?.data;
    const rows = Array.isArray(paginator?.data) ? paginator.data : [];

    /*
    |--------------------------------------------------------------------------
    | Order by ID
    |--------------------------------------------------------------------------
    | The table is always displayed in ascending ID order, regardless of the API
    | returned order.
    */
    return [...(rows as Service[])].sort((first, second) => {
      return Number(first.id) - Number(second.id);
    });
  }, [data]);

  const filteredServices = useMemo(() => {
    const key = search.trim().toLowerCase();

    return services
      .filter((service) => {
        const levels = normalizeAvailability(service.availability);

        const matchesSearch =
          !key ||
          service.name?.toLowerCase().includes(key) ||
          service.description?.toLowerCase().includes(key);

        const matchesStatus =
          statusFilter === "all" ? true : service.status === statusFilter;

        const matchesLevel =
          levelFilter === "all" ? true : levels.includes(levelFilter);

        return matchesSearch && matchesStatus && matchesLevel;
      })
      .sort((first, second) => Number(first.id) - Number(second.id));
  }, [services, search, statusFilter, levelFilter]);

  function resetForm() {
    setFormData(emptyForm);
    setSelectedService(null);
  }

  function closeCreateDialog() {
    setCreateOpen(false);
    resetForm();
  }

  function closeEditDialog() {
    setEditOpen(false);
    resetForm();
  }

  async function handleCreate() {
    await createMutation.mutateAsync({
      ...formData,
      name: formData.name.trim(),
      description: formData.description.trim(),
    });

    closeCreateDialog();
  }

  function openEditDialog(service: Service) {
    setSelectedService(service);
    setFormData(serviceToForm(service));
    setEditOpen(true);
  }

  async function handleUpdate() {
    if (!selectedService) return;

    await updateMutation.mutateAsync({
      id: selectedService.id,
      payload: {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
      },
    });

    closeEditDialog();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this service?")) return;
    await deleteMutation.mutateAsync(id);
  }

  async function handleToggleStatus(service: Service) {
    await updateMutation.mutateAsync({
      id: service.id,
      payload: {
        ...service,
        availability: normalizeAvailability(service.availability),
        status: service.status === "active" ? "inactive" : "active",
      },
    });
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setLevelFilter("all");
    setPage(1);
  }


  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
  Services ({data?.data?.total ?? 0})
</h1>
          <p className="text-sm text-muted-foreground">
            Manage services, fees, Back Officer requirement, level availability, and status.
          </p>
        </div>

        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>Create Service</Button>
          </DialogTrigger>

          <DialogContent
            className="z-[80] max-h-[90vh] overflow-y-auto sm:max-w-xl"
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Create Service</DialogTitle>
            </DialogHeader>

            <ServiceDialogForm
              formData={formData}
              setFormData={setFormData}
              submitLabel="Create"
              loading={createMutation.isPending}
              onSubmit={handleCreate}
              onCancel={closeCreateDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-3xl border bg-card p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label>Search</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by service name or description..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Level</Label>
            <Select
              value={levelFilter}
              onValueChange={(value) => {
                setLevelFilter(value as LevelFilter);
                setPage(1);
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="city">City</SelectItem>
                <SelectItem value="subcity">Subcity</SelectItem>
                <SelectItem value="woreda">Woreda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-4">
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-background shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-16 p-4 text-left">#</th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Fee</th>
                <th className="p-4 text-left">Level</th>
                <th className="p-4 text-left">Back Officer</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
<tbody>
  {isLoading ? (
    <tr>
      <td
        colSpan={7}
        className="p-8 text-center text-muted-foreground"
      >
        Loading services...
      </td>
    </tr>
  ) : filteredServices.length === 0 ? (
    <tr>
      <td
        colSpan={7}
        className="p-8 text-center text-muted-foreground"
      >
        No services found.
      </td>
    </tr>
  ) : (
    filteredServices.map((service, index) => {
      const levels = normalizeAvailability(service.availability);

      return (
        <tr key={service.id} className="border-t">
          <td className="p-4">
            {((data?.data?.current_page ?? 1) - 1) *
              (data?.data?.per_page ?? 15) +
              index +
              1}
          </td>

          <td className="p-4">
            <div>
              <p className="font-medium">{service.name}</p>

              {service.description && (
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {service.description}
                </p>
              )}
            </div>
          </td>

          <td className="p-4">
            {Number(service.service_fee || 0)}
          </td>

          <td className="p-4">
            <div className="flex flex-wrap gap-2">
              {levels.length ? (
                levels.map((level) => (
                  <span
                    key={level}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                  >
                    {levelLabel(level)}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  -
                </span>
              )}
            </div>
          </td>

          <td className="p-4">
            {service.has_back_officer ? "Yes" : "No"}
          </td>

          <td className="p-4">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                service.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {service.status}
            </span>
          </td>

          <td className="p-4">
            <div className="flex justify-end">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="z-[70]"
                >
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      window.setTimeout(
                        () => openEditDialog(service),
                        0
                      );
                    }}
                  >
                    Edit
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      window.setTimeout(
                        () => handleToggleStatus(service),
                        0
                      );
                    }}
                  >
                    {service.status === "active"
                      ? "Disable"
                      : "Enable"}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="text-red-600"
                    onSelect={(event) => {
                      event.preventDefault();
                      window.setTimeout(
                        () => handleDelete(service.id),
                        0
                      );
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </td>
        </tr>
      );
    })
  )}
</tbody>
          </table>
          
        </div>
      </div>

     <div className="flex items-center gap-2">
  <Button
    variant="outline"
    size="sm"
    disabled={!data?.data?.prev_page_url}
    onClick={() => setPage((current) => Math.max(current - 1, 1))}
  >
    Previous
  </Button>

  {Array.from(
    { length: data?.data?.last_page ?? 1 },
    (_, index) => index + 1
  )
    .slice(0, 10)
    .map((pageNumber) => (
      <Button
        key={pageNumber}
        size="sm"
        variant={page === pageNumber ? "default" : "outline"}
        onClick={() => setPage(pageNumber)}
      >
        {pageNumber}
      </Button>
    ))}

  <Button
    variant="outline"
    size="sm"
    disabled={!data?.data?.next_page_url}
    onClick={() => setPage((current) => current + 1)}
  >
    Next
  </Button>
</div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent
          className="z-[80] max-h-[90vh] overflow-y-auto sm:max-w-xl"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Update Service</DialogTitle>
          </DialogHeader>

          <ServiceDialogForm
            formData={formData}
            setFormData={setFormData}
            submitLabel="Update"
            loading={updateMutation.isPending}
            onSubmit={handleUpdate}
            onCancel={closeEditDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
