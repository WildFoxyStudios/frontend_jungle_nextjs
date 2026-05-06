"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import {
  Button,
  ConfirmDialog,
  Input,
  Label,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Category {
  id: number;
  name: string;
  type: string;
}

interface SubCategoryRow {
  id: number;
  category_id: number;
  lang_key: string;
  type: string;
}

interface SubCategoriesPanelProps {
  categoryType: "page" | "group" | "product";
  /** Type tag stored on sub_categories.type for this section. */
  subType: string;
}

/**
 * Generic CRUD panel for sub-categories filtered by parent category.type.
 * Used by groups-sub-categories, pages-sub-categories, and
 * products-sub-categories admin pages.
 */
export function SubCategoriesPanel({ categoryType, subType }: SubCategoriesPanelProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubCategoryRow | null>(null);
  const [form, setForm] = useState({ category_id: "", lang_key: "" });
  const [pendingDelete, setPendingDelete] = useState<SubCategoryRow | null>(null);

  const { data: categoriesRaw, isLoading: loadingCats } = useQuery({
    queryKey: ["admin", "categories", categoryType],
    queryFn: () => adminApi.getCategories(categoryType),
  });
  const categories = (categoriesRaw ?? []) as Category[];

  const { data: subCatRaw, isLoading } = useQuery({
    queryKey: ["admin", "sub-categories", subType],
    queryFn: async () => {
      const res = await adminApi.getSubCategories({ type: subType });
      return ((res?.data ?? []) as SubCategoryRow[]);
    },
  });
  const subCategories = subCatRaw ?? [];

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin", "sub-categories", subType] });

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createSubCategory({
        category_id: Number(form.category_id),
        lang_key: form.lang_key.trim(),
        type: subType,
      }),
    onSuccess: () => {
      toast.success("Sub-category created");
      invalidate();
      setOpen(false);
      setForm({ category_id: "", lang_key: "" });
    },
    onError: () => toast.error("Failed to create sub-category"),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      adminApi.updateSubCategory(editing!.id, {
        category_id: Number(form.category_id),
        lang_key: form.lang_key.trim(),
        type: subType,
      }),
    onSuccess: () => {
      toast.success("Sub-category updated");
      invalidate();
      setOpen(false);
      setEditing(null);
      setForm({ category_id: "", lang_key: "" });
    },
    onError: () => toast.error("Failed to update sub-category"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteSubCategory(id),
    onSuccess: () => {
      toast.success("Sub-category deleted");
      invalidate();
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ category_id: "", lang_key: "" });
    setOpen(true);
  };

  const openEdit = (row: SubCategoryRow) => {
    setEditing(row);
    setForm({ category_id: String(row.category_id), lang_key: row.lang_key });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!form.category_id || !form.lang_key.trim()) return;
    if (editing) updateMutation.mutate();
    else createMutation.mutate();
  };

  const categoryName = (id: number) => categories.find((c) => c.id === id)?.name ?? `#${id}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={openCreate} disabled={loadingCats || categories.length === 0}>
          <Plus className="h-4 w-4 mr-1" /> New sub-category
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="border bg-card divide-y-2 divide-foreground shadow-sm">
          {subCategories.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm font-bold uppercase tracking-wide">
              No sub-categories yet for {categoryType}.
            </p>
          )}
          {subCategories.map((row) => (
            <div key={row.id} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex flex-col">
                <span className="font-medium text-sm">{row.lang_key}</span>
                <span className="text-xs text-muted-foreground">
                  Parent: {categoryName(row.category_id)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setPendingDelete(row)}
                  disabled={deleteMutation.isPending}
                  aria-label="Delete sub-category"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => {
          if (!o) setPendingDelete(null);
        }}
        variant="destructive"
        title="Delete this sub-category?"
        description={
          pendingDelete
            ? `"${pendingDelete.lang_key}" will be permanently removed.`
            : undefined
        }
        confirmText="Delete"
        onConfirm={async () => {
          if (!pendingDelete) return;
          await deleteMutation.mutateAsync(pendingDelete.id);
          setPendingDelete(null);
        }}
      />

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit sub-category" : "New sub-category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Parent category</Label>
              <Select
                value={form.category_id}
                onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCats ? "Loading…" : "Select a category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Translation key</Label>
              <Input
                value={form.lang_key}
                onChange={(e) => setForm((f) => ({ ...f, lang_key: e.target.value }))}
                placeholder="e.g. tech, sports, books"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !form.category_id ||
                !form.lang_key.trim() ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
