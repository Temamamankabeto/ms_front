"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, LayoutTemplate, Pencil, Trash2 } from "lucide-react";

import {
  useServiceForms,
  useCreateServiceForm,
  useUpdateServiceForm,
  useDeleteServiceForm,
} from "@/hooks/services/useServiceForms";
import { useDropdownServices } from "@/hooks/services/use-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ServiceFormsPage() {
  const { data, isLoading } = useServiceForms();

  const create = useCreateServiceForm();
  const update = useUpdateServiceForm();
  const remove = useDeleteServiceForm();

const { data: servicesResponse } = useDropdownServices();

const services = useMemo(
  () => normalizeServices(servicesResponse),
  [servicesResponse]
);
  const forms: any[] = Array.isArray(data)
  ? data
  : Array.isArray((data as any)?.data?.data)
    ? (data as any).data.data
    : Array.isArray((data as any)?.data)
      ? (data as any).data
      : [];

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    id: null as number | null,
    service_id: "",
    title: "",
    description: "",
    is_active: true,
  });  const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 30;


  const filteredForms = useMemo(() => {
    const keyword = search.toLowerCase();

    return forms.filter((item: any) => {
      const serviceName =
        services.find((service: any) => service.id == item.service_id)?.name ||
        item.service?.name ||
        "";

      return (
        item.title?.toLowerCase().includes(keyword) ||
        item.description?.toLowerCase().includes(keyword) ||
        serviceName?.toLowerCase().includes(keyword)
      );
    });
  }, [forms, search, services]);
const totalPages = Math.ceil(
  filteredForms.length / itemsPerPage
);

const paginatedForms = filteredForms.slice(
  (currentPage - 1) * itemsPerPage,
  currentPage * itemsPerPage
);

function reset() {
    setForm({
      id: null,
      service_id: "",
      title: "",
      description: "",
      is_active: true,
    });
  }

  function openCreate() {
    reset();
    setOpen(true);
  }

  function openEdit(item: any) {
    setForm({
      id: item.id,
      service_id: String(item.service_id),
      title: item.title,
      description: item.description || "",
      is_active: item.is_active !== false,
    });

    setOpen(true);
  }

  async function submit() {
    const payload = {
      service_id: Number(form.service_id),
      title: form.title,
      description: form.description,
      is_active: form.is_active,
    };

    if (form.id) {
      await update.mutateAsync({ id: form.id, payload });
    } else {
      await create.mutateAsync(payload);
    }

    setOpen(false);
    reset();
  }

  function normalizeServices(response: any) {
  const value = response?.data ?? response;

  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.data)) return value.data.data;

  return [];
}

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Service Forms</CardTitle>
            <p className="text-sm text-muted-foreground">
              Create forms, then open builder to manage steps, sections, fields, and conditions.
            </p>
          </div>

          <Button onClick={openCreate}>Create Form</Button>
        </CardHeader>

        <CardContent>
          <div className="mb-4">
            <Input placeholder="Search forms..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>

          <div className="rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
  {paginatedForms.length ? (
    paginatedForms.map((item: any, index: number) => (
      <TableRow key={item.id}>
        <TableCell>
          <Badge variant="outline">
            {(currentPage - 1) * itemsPerPage + index + 1}
          </Badge>
        </TableCell>

        <TableCell>
         {services.find(
  (service: any) =>
    String(service.id) === String(item.service_id)
)?.name ??
  item.service?.name ??
  "-"}
        </TableCell>

        <TableCell>
          <div className="font-medium">{item.title}</div>
          <div className="text-xs text-muted-foreground">
            {item.description || "No description"}
          </div>
        </TableCell>

        <TableCell>
          <Badge
            variant={
              item.is_active === false
                ? "secondary"
                : "default"
            }
          >
            {item.is_active === false
              ? "Inactive"
              : "Active"}
          </Badge>
        </TableCell>

        <TableCell>
          <div className="flex justify-end gap-2">
            <Button asChild variant="outline" size="sm">
              <Link
                href={`/dashboard/service-forms/${item.id}/builder`}
              >
                <LayoutTemplate className="mr-2 h-4 w-4" />
                Builder
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => openEdit(item)}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => remove.mutate(item.id)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ))
  ) : (
    <TableRow>
      <TableCell
        colSpan={5}
        className="py-10 text-center text-muted-foreground"
      >
        No service forms found.
      </TableCell>
    </TableRow>
  )}
</TableBody>
            </Table>

            <div className="flex items-center justify-between border-t px-4 py-4">
  <div className="text-sm text-muted-foreground">
    Showing{" "}
    {filteredForms.length === 0
      ? 0
      : (currentPage - 1) * itemsPerPage + 1}
    {" - "}
    {Math.min(
      currentPage * itemsPerPage,
      filteredForms.length
    )}
    {" of "}
    {filteredForms.length}
  </div>

  <div className="flex items-center gap-2">
    <Button
      size="sm"
      variant="outline"
      disabled={currentPage === 1}
      onClick={() =>
        setCurrentPage((prev) => prev - 1)
      }
    >
      Previous
    </Button>

    <span className="text-sm font-medium">
      Page {currentPage} of {totalPages || 1}
    </span>

    <Button
      size="sm"
      variant="outline"
      disabled={
        currentPage >= totalPages ||
        totalPages === 0
      }
      onClick={() =>
        setCurrentPage((prev) => prev + 1)
      }
    >
      Next
    </Button>
  </div>
</div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Service Form" : "Create Service Form"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
          <Select
  value={form.service_id}
  onValueChange={(value) =>
    setForm({
      ...form,
      service_id: value,
    })
  }
>
  <SelectTrigger>
    <SelectValue placeholder="Select service" />
  </SelectTrigger>

  <SelectContent>
    {services.map((service: any) => (
      <SelectItem
        key={service.id}
        value={String(service.id)}
      >
        {service.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

            <Input placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />

            <Input
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              />
              Active
            </label>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>

              <Button onClick={submit} disabled={!form.service_id || !form.title}>
                {form.id ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
