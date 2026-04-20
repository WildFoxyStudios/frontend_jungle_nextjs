"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import type { ColumnDef } from "@tanstack/react-table";
import { Button, Input, ConfirmDialog, Dialog, DialogContent, DialogHeader, DialogTitle, Label } from "@jungle/ui";
import { DataTable } from "@/components/data-table/DataTable";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Section {
  id: number;
  name: string;
  description?: string;
  sort_order?: number;
}

export default function ForumSectionsPage() {
  const qc = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<Section | null>(null);
  const [editTarget, setEditTarget] = useState<Section | null | "new">(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "forum-sections"],
    queryFn: () => adminApi.getForumSections(),
  });

  const create = useMutation({
    mutationFn: (d: typeof form) => adminApi.createForumSection(d),
    onSuccess: () => { toast.success("Section created"); qc.invalidateQueries({ queryKey: ["admin", "forum-sections"] }); setEditTarget(null); },
    onError: () => toast.error("Failed to create section"),
  });

  const update = useMutation({
    mutationFn: ({ id, d }: { id: number; d: typeof form }) => adminApi.updateForumSection(id, d),
    onSuccess: () => { toast.success("Section updated"); qc.invalidateQueries({ queryKey: ["admin", "forum-sections"] }); setEditTarget(null); },
    onError: () => toast.error("Failed to update section"),
  });

  const del = useMutation({
    mutationFn: (id: number) => adminApi.deleteForumSection(id),
    onSuccess: () => { toast.success("Section deleted"); qc.invalidateQueries({ queryKey: ["admin", "forum-sections"] }); },
    onError: () => toast.error("Failed to delete section"),
  });

  const openCreate = () => { setForm({ name: "", description: "" }); setEditTarget("new"); };
  const openEdit = (s: Section) => { setForm({ name: s.name, description: s.description ?? "" }); setEditTarget(s); };

  const handleSave = async () => {
    if (editTarget === "new") { await create.mutateAsync(form); }
    else if (editTarget) { await update.mutateAsync({ id: editTarget.id, d: form }); }
  };

  const sections = (data ?? []) as Section[];

  const columns: ColumnDef<Section>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "sort_order", header: "Order", size: 70 },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row.original)}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setPendingDelete(row.original)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageShell
      title="Forum Sections"
      description="Top-level categories that group forums together."
      actions={<Button size="sm" onClick={openCreate} className="gap-1.5"><Plus className="h-4 w-4" /> New Section</Button>}
    >
      <DataTable data={sections} columns={columns} isLoading={isLoading} />

      <Dialog open={editTarget !== null} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget === "new" ? "New Section" : "Edit Section"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sec-name">Name</Label>
              <Input id="sec-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sec-desc">Description</Label>
              <Input id="sec-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!form.name.trim()}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        title={`Delete section "${pendingDelete?.name}"?`}
        description="This will remove the section and may affect associated forums."
        confirmText="Delete"
        variant="destructive"
        onConfirm={async () => { if (pendingDelete) await del.mutateAsync(pendingDelete.id); }}
      />
    </AdminPageShell>
  );
}
