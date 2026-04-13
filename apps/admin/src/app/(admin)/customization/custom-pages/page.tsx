"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Input, Label, Badge, Card, CardContent, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface CustomPage { id: number; slug: string; title: string; page_type: string; active: boolean }

export default function CustomPagesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CustomPage | null>(null);
  const [form, setForm] = useState({ slug: "", title: "", content: "", page_type: "custom" });

  const { data, isLoading } = useQuery({ queryKey: ["admin", "custom-pages"], queryFn: () => adminApi.getAdminCustomPages() });

  const saveMutation = useMutation({
    mutationFn: () => editing ? adminApi.updateAdminCustomPage(editing.id, form) : adminApi.createAdminCustomPage(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "custom-pages"] }); setOpen(false); toast.success(editing ? "Updated" : "Created"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteAdminCustomPage(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "custom-pages"] }); toast.success("Deleted"); },
  });

  const pages = (data ?? []) as CustomPage[];

  const openCreate = () => { setEditing(null); setForm({ slug: "", title: "", content: "", page_type: "custom" }); setOpen(true); };
  const openEdit = (p: CustomPage) => { setEditing(p); setForm({ slug: p.slug, title: p.title, content: "", page_type: p.page_type }); setOpen(true); };

  return (
    <AdminPageShell title="Custom Pages" actions={<Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Page</Button>}>
      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <div className="border rounded-lg divide-y">
          {pages.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No custom pages yet.</p>}
          {pages.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{p.title}</span>
                <code className="text-xs text-muted-foreground">/{p.slug}</code>
                <Badge variant={p.active ? "default" : "secondary"}>{p.active ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Page" : "New Custom Page"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="about-us" /></div>
            </div>
            <div className="space-y-1"><Label>Content (HTML)</Label><textarea className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title || !form.slug || saveMutation.isPending}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
