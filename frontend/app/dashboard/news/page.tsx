"use client";

import { FormEvent, useState } from "react";
import { Edit3, Newspaper, Plus, Search, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { newsService, type NewsItem } from "@/services/news/news.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type NewsFormState = {
  title: string;
  description: string;
  status: "active" | "inactive";
};

const empty: NewsFormState = { title: "", description: "", status: "active" };

export default function NewsManagementPage() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState<NewsFormState>(empty);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-news", search],
    queryFn: () => newsService.list({ search, per_page: 50 }),
  });

  const refresh = () => client.invalidateQueries({ queryKey: ["admin-news"] });
  const create = useMutation({ mutationFn: newsService.create, onSuccess: refresh });
  const update = useMutation({ mutationFn: ({ id, payload }: { id: number; payload: NewsFormState }) => newsService.update(id, payload), onSuccess: refresh });
  const remove = useMutation({ mutationFn: newsService.remove, onSuccess: refresh });

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setModal(true);
  }

  function openEdit(item: NewsItem) {
    setEditing(item);
    setForm({ title: item.title, description: item.description, status: item.status });
    setModal(true);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      if (editing) await update.mutateAsync({ id: editing.id, payload: form });
      else await create.mutateAsync(form);
      toast.success(editing ? "News updated successfully" : "News created successfully");
      setModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save news");
    }
  }

  async function deleteItem(item: NewsItem) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await remove.mutateAsync(item.id);
      toast.success("News deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete news");
    }
  }

  const items = data?.data ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Newspaper className="h-5 w-5" />News Management</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Create, update, activate, or remove public city news.</p>
          </div>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Create News</Button>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search news..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="p-4 text-left">Title</th>
                  <th className="p-4 text-left">Description</th>
                  <th className="p-4 text-left">City</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td className="p-8 text-center" colSpan={5}>Loading...</td></tr> : null}
                {!isLoading && items.length === 0 ? <tr><td className="p-8 text-center text-muted-foreground" colSpan={5}>No news found.</td></tr> : null}
                {items.map((item) => (
                  <tr key={item.id} className="border-b align-top">
                    <td className="p-4 font-semibold">{item.title}</td>
                    <td className="max-w-xl p-4 text-muted-foreground">{item.description}</td>
                    <td className="p-4">{item.city?.name ?? "-"}</td>
                    <td className="p-4"><span className="rounded-full bg-muted px-2 py-1 text-xs">{item.status}</span></td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit3 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteItem(item)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Update News" : "Create News"}</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-36" required /></div>
            <div className="space-y-2"><Label htmlFor="status">Status</Label><select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })} className="h-10 w-full rounded-md border bg-background px-3"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setModal(false)}>Cancel</Button><Button type="submit" disabled={create.isPending || update.isPending}>{editing ? "Update" : "Create"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}