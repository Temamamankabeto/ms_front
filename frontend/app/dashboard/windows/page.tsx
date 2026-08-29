"use client";

import { useMemo, useState } from "react";
import { MoreVertical } from "lucide-react";

import {
  useCreateWindow,
  useDeleteWindow,
  useUpdateWindow,
  useWindows,
} from "@/hooks/windows/use-window";

import {
  Window as AppWindow,
  WindowAvailability,
} from "@/types/windows/window";

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

type FormState = {
  name: string;
  availability: WindowAvailability[];
  city_title: string;
  subcity_title: string;
  woreda_title: string;
};

const LEVELS: WindowAvailability[] = ["city", "subcity", "woreda"];

const emptyForm: FormState = {
  name: "",
  availability: [],
  city_title: "",
  subcity_title: "",
  woreda_title: "",
};

function normalizeAvailability(value: unknown): WindowAvailability[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).toLowerCase())
      .filter((item): item is WindowAvailability =>
        LEVELS.includes(item as WindowAvailability)
      );
  }

  if (typeof value === "string") {
    try {
      return normalizeAvailability(JSON.parse(value));
    } catch {
      return LEVELS.includes(value as WindowAvailability)
        ? [value as WindowAvailability]
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

    return LEVELS.filter((level) => Boolean(record[level]));
  }

  return [];
}

function titleForLevel(item: AppWindow, level: WindowAvailability) {
  if (level === "city") return item.city_title || item.title || item.name;
  if (level === "subcity") return item.subcity_title || item.title || item.name;
  return item.woreda_title || item.title || item.name;
}

function WindowForm({
  formData,
  setFormData,
  loading,
  submitLabel,
  loadingLabel,
  onSubmit,
  onCancel,
}: {
  formData: FormState;
  setFormData: React.Dispatch<React.SetStateAction<FormState>>;
  loading: boolean;
  submitLabel: string;
  loadingLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  function toggleLevel(level: WindowAvailability, checked: boolean) {
    setFormData((current) => ({
      ...current,
      availability: checked
        ? Array.from(new Set([...current.availability, level]))
        : current.availability.filter((item) => item !== level),
    }));
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="window-name">Window Name</Label>
        <Input
          id="window-name"
          autoComplete="off"
          placeholder="Example: Window 1"
          value={formData.name}
          onChange={(event) =>
            setFormData((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
        />
      </div>

      <div className="space-y-3">
        <Label>Administrative Level</Label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {LEVELS.map((level) => (
            <label
              key={level}
              className="flex cursor-pointer items-center gap-2 rounded-xl border p-3 transition hover:bg-muted"
            >
              <Checkbox
                checked={formData.availability.includes(level)}
                onCheckedChange={(checked) =>
                  toggleLevel(level, Boolean(checked))
                }
              />
              <span className="text-sm font-medium capitalize">
                {level}
              </span>
            </label>
          ))}
        </div>
      </div>

      {formData.availability.includes("city") && (
        <div className="space-y-2">
          <Label htmlFor="city-title">City Window Title</Label>
          <Input
            id="city-title"
            autoComplete="off"
            placeholder="Example: Land Services"
            value={formData.city_title}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                city_title: event.target.value,
              }))
            }
          />
        </div>
      )}

      {formData.availability.includes("subcity") && (
        <div className="space-y-2">
          <Label htmlFor="subcity-title">Subcity Window Title</Label>
          <Input
            id="subcity-title"
            autoComplete="off"
            placeholder="Example: Business Registration Services"
            value={formData.subcity_title}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                subcity_title: event.target.value,
              }))
            }
          />
        </div>
      )}

      {formData.availability.includes("woreda") && (
        <div className="space-y-2">
          <Label htmlFor="woreda-title">Woreda Window Title</Label>
          <Input
            id="woreda-title"
            autoComplete="off"
            placeholder="Example: Resident Identification Services"
            value={formData.woreda_title}
            onChange={(event) =>
              setFormData((current) => ({
                ...current,
                woreda_title: event.target.value,
              }))
            }
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <Button
          type="button"
          disabled={
            loading ||
            !formData.name.trim() ||
            formData.availability.length === 0 ||
            (formData.availability.includes("city") &&
              !formData.city_title.trim()) ||
            (formData.availability.includes("subcity") &&
              !formData.subcity_title.trim()) ||
            (formData.availability.includes("woreda") &&
              !formData.woreda_title.trim())
          }
          onClick={onSubmit}
        >
          {loading ? loadingLabel : submitLabel}
        </Button>
      </div>
    </div>
  );
}

export default function WindowPage() {
  const [page] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedWindow, setSelectedWindow] =
    useState<AppWindow | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);

  const { data, isLoading } = useWindows(page);
  const createMutation = useCreateWindow();
  const updateMutation = useUpdateWindow();
  const deleteMutation = useDeleteWindow();

  const windows = useMemo(() => {
    const rows = data?.data?.data || [];

    return [...rows].sort((a: AppWindow, b: AppWindow) => {
      return Number(a.id) - Number(b.id);
    });
  }, [data]);

  function resetForm() {
    setFormData(emptyForm);
    setSelectedWindow(null);
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
      name: formData.name.trim(),
      availability: formData.availability,
      city_title: formData.availability.includes("city")
        ? formData.city_title.trim()
        : null,
      subcity_title: formData.availability.includes("subcity")
        ? formData.subcity_title.trim()
        : null,
      woreda_title: formData.availability.includes("woreda")
        ? formData.woreda_title.trim()
        : null,
    });

    closeCreateDialog();
  }

  function openEditDialog(item: AppWindow) {
    const availability = normalizeAvailability(item.availability);

    setSelectedWindow(item);

    setFormData({
      name: item.name || "",
      availability,
      city_title: item.city_title || "",
      subcity_title: item.subcity_title || "",
      woreda_title: item.woreda_title || "",
    });

    setEditOpen(true);
  }

  async function handleUpdate() {
    if (!selectedWindow) return;

    await updateMutation.mutateAsync({
      id: selectedWindow.id,
      payload: {
        name: formData.name.trim(),
        availability: formData.availability,
        city_title: formData.availability.includes("city")
          ? formData.city_title.trim()
          : null,
        subcity_title: formData.availability.includes("subcity")
          ? formData.subcity_title.trim()
          : null,
        woreda_title: formData.availability.includes("woreda")
          ? formData.woreda_title.trim()
          : null,
      },
    });

    closeEditDialog();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this window?")) return;
    await deleteMutation.mutateAsync(id);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-3 sm:p-6">
      <div className="flex flex-col gap-4 rounded-3xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Windows</h1>
          <p className="text-sm text-muted-foreground">
            Manage shared window names and dynamic titles by administrative
            level.
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
            <Button>Create Window</Button>
          </DialogTrigger>

          <DialogContent
            className="z-[80] max-h-[90vh] overflow-y-auto sm:max-w-2xl"
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Create Window</DialogTitle>
            </DialogHeader>

            <WindowForm
              formData={formData}
              setFormData={setFormData}
              loading={createMutation.isPending}
              submitLabel="Create"
              loadingLabel="Creating..."
              onSubmit={handleCreate}
              onCancel={closeCreateDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-background shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-20 p-4 text-left">#</th>
                <th className="p-4 text-left">Window Name</th>
                <th className="p-4 text-left">Administrative Level</th>
                <th className="p-4 text-left">City Window Title</th>
                <th className="p-4 text-left">Subcity Window Title</th>
                <th className="p-4 text-left">Woreda Window Title</th>
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
                    Loading windows...
                  </td>
                </tr>
              ) : windows.length > 0 ? (
                windows.map((item: AppWindow, index: number) => {
                  const availability = normalizeAvailability(item.availability);

                  return (
                    <tr key={item.id} className="border-t">
                      <td className="p-4">{index + 1}</td>
                      <td className="p-4 font-semibold">{item.name}</td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {availability.length ? (
                            availability.map((level) => (
                              <span
                                key={level}
                                className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize"
                              >
                                {level}
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
                        {availability.includes("city")
                          ? titleForLevel(item, "city")
                          : "-"}
                      </td>
                      <td className="p-4">
                        {availability.includes("subcity")
                          ? titleForLevel(item, "subcity")
                          : "-"}
                      </td>
                      <td className="p-4">
                        {availability.includes("woreda")
                          ? titleForLevel(item, "woreda")
                          : "-"}
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
                                onClick={() => {
                                  document.body.click();

                                  globalThis.setTimeout(() => {
                                    openEditDialog(item);
                                  }, 80);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  document.body.click();

                                  globalThis.setTimeout(() => {
                                    handleDelete(item.id);
                                  }, 80);
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
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No windows found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent
          className="z-[80] max-h-[90vh] overflow-y-auto sm:max-w-2xl"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Update Window</DialogTitle>
          </DialogHeader>

          <WindowForm
            formData={formData}
            setFormData={setFormData}
            loading={updateMutation.isPending}
            submitLabel="Update"
            loadingLabel="Updating..."
            onSubmit={handleUpdate}
            onCancel={closeEditDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
