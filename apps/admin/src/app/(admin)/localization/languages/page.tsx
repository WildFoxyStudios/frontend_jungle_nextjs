"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Input, Label, Badge, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Trash2, Star } from "lucide-react";
import Link from "next/link";

interface Language {
  id: number;
  name: string;
  code: string;
  rtl: boolean;
  is_default: boolean;
}

export default function LanguagesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Language | null>(null);
  const [form, setForm] = useState({ name: "", code: "", rtl: false });

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "languages"],
    queryFn: () => adminApi.getLanguages(),
  });

  const languages = (data ?? []) as Language[];

  const createMutation = useMutation({
    mutationFn: () => adminApi.createLanguage(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "languages"] });
      setOpen(false);
      setForm({ name: "", code: "", rtl: false });
      toast.success("Language created");
    },
    onError: () => toast.error("Failed to create language"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteLanguage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "languages"] });
      setDeleteTarget(null);
      toast.success("Language deleted");
    },
    onError: () => toast.error("Failed to delete language"),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => adminApi.updateLanguage(id, { is_default: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "languages"] });
      toast.success("Default language updated");
    },
    onError: () => toast.error("Failed to set default language"),
  });

  return (
    <AdminPageShell
      title="Languages"
      description="Manage site languages and translations"
      actions={
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Language
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : error ? (
        <p className="text-sm text-destructive">Failed to load languages.</p>
      ) : (
        <div className="border bg-card divide-y-2 divide-foreground shadow-sm">
          {languages.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm font-bold uppercase tracking-wide">
              No languages configured yet.
            </p>
          )}
          {languages.map((lang) => (
            <div key={lang.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{lang.name}</span>
                <Badge variant="secondary">{lang.code}</Badge>
                {lang.is_default && <Badge>Default</Badge>}
                {lang.rtl && <Badge variant="outline">RTL</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/localization/translations/${lang.code}`}>
                  <Button variant="outline" size="sm">Edit Translations</Button>
                </Link>
                {!lang.is_default && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate(lang.id)}
                      disabled={setDefaultMutation.isPending}
                    >
                      <Star className="h-3.5 w-3.5 mr-1" /> Set Default
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(lang)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Language</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Spanish"
              />
            </div>
            <div className="space-y-1">
              <Label>Language Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="e.g. es"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rtl"
                checked={form.rtl}
                onChange={(e) => setForm((f) => ({ ...f, rtl: e.target.checked }))}
                className="h-4 w-4"
              />
              <Label htmlFor="rtl">Right-to-left (RTL)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!form.name || !form.code || createMutation.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Language</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.code})? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
