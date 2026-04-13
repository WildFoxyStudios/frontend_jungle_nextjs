"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Button, Input, Label, Badge, Skeleton,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@jungle/ui";
import { Plus, Pencil, Trash2 } from "lucide-react";

const CATEGORY_TYPES = ["page", "group", "blog", "product", "job"] as const;
type CategoryType = typeof CATEGORY_TYPES[number];

interface Category {
  id: number;
  name: string;
  type: string;
  parent_id?: number;
  active: boolean;
  sort_order: number;
}

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [selectedType, setSelectedType] = useState<CategoryType>("page");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", type: selectedType as string });

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin", "categories", selectedType],
    queryFn: () => adminApi.getCategories(selectedType),
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; type: string }) => adminApi.createCategory(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "categories"] }); setDialogOpen(false); setForm({ name: "", type: selectedType }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; active?: boolean } }) =>
      adminApi.updateCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "categories"] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", type: selectedType });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, type: cat.type });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: { name: form.name } });
      setDialogOpen(false);
    } else {
      createMutation.mutate({ name: form.name, type: form.type });
    }
  };

  return (
    <AdminPageShell title="Categories">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {CATEGORY_TYPES.map((t) => (
            <Button
              key={t}
              variant={selectedType === t ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(t)}
              className="capitalize"
            >
              {t}
            </Button>
          ))}
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {(categories ?? []).length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No {selectedType} categories yet.
            </p>
          )}
          {(categories ?? []).map((cat) => (
            <div key={cat.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm">{cat.name}</span>
                {!cat.active && <Badge variant="secondary">Inactive</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateMutation.mutate({ id: cat.id, data: { active: !cat.active } })}
                  className="text-xs"
                >
                  {cat.active ? "Disable" : "Enable"}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteMutation.mutate(cat.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Category name"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
            {!editing && (
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}
            >
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
