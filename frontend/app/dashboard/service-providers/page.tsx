"use client";

import { useState } from "react";
import { Building2, MoreVertical, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import {
  useCreateServiceProvider,
  useDeleteServiceProvider,
  useServiceProviders,
  useUpdateServiceProvider,
} from "@/hooks/service-providers/use-service-providers";
import { ServiceProvider } from "@/types/service-providers/service-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function ServiceProvidersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<ServiceProvider | null>(null);
  const [name, setName] = useState("");

  const { data, isLoading } = useServiceProviders(page, search);
  const createMutation = useCreateServiceProvider();
  const updateMutation = useUpdateServiceProvider();
  const deleteMutation = useDeleteServiceProvider();

  const providers = data?.data ?? [];
  const meta = data?.meta;

  function openCreate() {
    setSelected(null);
    setName("");
    setFormOpen(true);
  }

  function openEdit(provider: ServiceProvider) {
    setSelected(provider);
    setName(provider.name);
    setFormOpen(true);
  }

  async function save() {
    const payload = { name: name.trim() };
    if (!payload.name) return;

    if (selected) {
      await updateMutation.mutateAsync({ id: selected.id, payload });
      toast.success("Service provider updated successfully");
    } else {
      await createMutation.mutateAsync(payload);
      toast.success("Service provider created successfully");
    }

    setFormOpen(false);
    setSelected(null);
    setName("");
  }

  async function remove(provider: ServiceProvider) {
    if (!confirm(`Delete ${provider.name}?`)) return;
    await deleteMutation.mutateAsync(provider.id);
    toast.success("Service provider deleted successfully");
  }

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Super Admin</p>
          <h1 className="text-2xl font-bold tracking-tight">Service Providers</h1>
          <p className="text-sm text-muted-foreground">
            Manage government offices that provide digital services.
          </p>
        </div>

        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Add Provider
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Provider Directory
          </CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search provider..."
              className="pl-9"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">Loading service providers...</td></tr>
                ) : providers.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">No service providers found.</td></tr>
                ) : (
                  providers.map((provider, index) => (
                    <tr key={provider.id} className="border-t">
                      <td className="px-4 py-3 text-muted-foreground">
                        {((meta?.current_page ?? 1) - 1) * (meta?.per_page ?? 15) + index + 1}
                      </td>
                      <td className="px-4 py-3 font-medium">{provider.name}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(provider)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => remove(provider)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.last_page > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {meta.current_page} of {meta.last_page}</span>
              <Button variant="outline" disabled={page >= meta.last_page} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected ? "Edit Service Provider" : "Create Service Provider"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider-name">Name</Label>
              <Input id="provider-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Mayor Office" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button disabled={saving || !name.trim()} onClick={save}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
