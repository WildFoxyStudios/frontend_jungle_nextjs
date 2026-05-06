"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
  Textarea,
} from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

type MovieRow = {
  id: number;
  name?: string;
  title?: string;
  video_url?: string;
  iframe_url?: string;
  cover?: string;
  description?: string;
  genre?: string;
  country?: string;
  stars?: string;
  producer?: string;
  release_year?: number | null;
  duration?: string;
  quality?: string;
  category_id?: number | null;
  is_approved?: boolean;
  is_featured?: boolean;
  view_count?: number;
  created_at?: string;
};

type MovieForm = {
  name: string;
  video_url: string;
  iframe_url: string;
  cover: string;
  description: string;
  genre: string;
  country: string;
  stars: string;
  producer: string;
  release_year: string;
  duration: string;
  quality: string;
  category_id: string;
  is_approved: boolean;
};

const EMPTY_FORM: MovieForm = {
  name: "",
  video_url: "",
  iframe_url: "",
  cover: "",
  description: "",
  genre: "",
  country: "",
  stars: "",
  producer: "",
  release_year: "",
  duration: "",
  quality: "",
  category_id: "",
  is_approved: true,
};

function rowToForm(row: MovieRow): MovieForm {
  return {
    name: row.name ?? row.title ?? "",
    video_url: row.video_url ?? "",
    iframe_url: row.iframe_url ?? "",
    cover: row.cover ?? "",
    description: row.description ?? "",
    genre: row.genre ?? "",
    country: row.country ?? "",
    stars: row.stars ?? "",
    producer: row.producer ?? "",
    release_year: row.release_year != null ? String(row.release_year) : "",
    duration: row.duration ?? "",
    quality: row.quality ?? "",
    category_id: row.category_id != null ? String(row.category_id) : "",
    is_approved: row.is_approved ?? true,
  };
}

function formToPayload(form: MovieForm): Record<string, unknown> {
  return {
    name: form.name.trim(),
    video_url: form.video_url.trim(),
    iframe_url: form.iframe_url.trim() || null,
    cover: form.cover.trim() || null,
    description: form.description.trim() || null,
    genre: form.genre.trim() || null,
    country: form.country.trim() || null,
    stars: form.stars.trim() || null,
    producer: form.producer.trim() || null,
    release_year: form.release_year ? Number(form.release_year) : null,
    duration: form.duration.trim() || null,
    quality: form.quality.trim() || null,
    category_id: form.category_id ? Number(form.category_id) : null,
    is_approved: form.is_approved,
  };
}

export default function MoviesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MovieRow | null>(null);
  const [form, setForm] = useState<MovieForm>(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState<MovieRow | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "movies", page],
    queryFn: () => adminApi.getAdminMovies({ page: String(page) }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "movies"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = formToPayload(form);
      if (!payload.name) throw new Error("Title is required");
      if (!payload.video_url) throw new Error("Video URL is required");
      if (editing) return adminApi.updateAdminMovie(editing.id, payload);
      return adminApi.createAdminMovie(payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Movie updated" : "Movie created");
      setOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      invalidate();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to save movie";
      toast.error(msg);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (row: MovieRow) => {
    setEditing(row);
    setForm(rowToForm(row));
    setOpen(true);
  };

  const update = <K extends keyof MovieForm>(key: K, value: MovieForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const columns: ColumnDef<MovieRow>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    {
      accessorKey: "name",
      header: "Title",
      cell: ({ row }) => row.original.name ?? row.original.title ?? "—",
    },
    { accessorKey: "genre", header: "Genre" },
    { accessorKey: "view_count", header: "Views" },
    {
      accessorKey: "is_featured",
      header: "Featured",
      cell: ({ row }) => (row.original.is_featured ? <Badge>Featured</Badge> : null),
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) =>
        row.original.created_at ? new Date(row.original.created_at).toLocaleDateString() : "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row.original)}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await adminApi.approveAdminMovie(row.original.id);
              toast.success("Approved");
              refetch();
            }}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              await adminApi.featureAdminMovie(row.original.id);
              toast.success("Featured");
              refetch();
            }}
          >
            Feature
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setPendingDelete(row.original)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageShell
      title="Movies"
      actions={
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New movie
        </Button>
      }
    >
      <DataTable
        data={(data?.data ?? []) as MovieRow[]}
        columns={columns}
        isLoading={isLoading}
        pagination={
          data
            ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage }
            : undefined
        }
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => {
          if (!o) setPendingDelete(null);
        }}
        variant="destructive"
        title="Delete this movie?"
        description={
          pendingDelete
            ? `“${pendingDelete.name ?? pendingDelete.title ?? `#${pendingDelete.id}`}” will be permanently removed from the catalogue.`
            : undefined
        }
        confirmText="Delete"
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await adminApi.deleteAdminMovie(pendingDelete.id);
            toast.success("Deleted");
            refetch();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete movie");
          } finally {
            setPendingDelete(null);
          }
        }}
      />

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditing(null);
            setForm(EMPTY_FORM);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit movie #${editing.id}` : "New movie"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label>Title *</Label>
              <Input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Movie title"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>Video URL *</Label>
              <Input
                value={form.video_url}
                onChange={(e) => update("video_url", e.target.value)}
                placeholder="https://… or s3://…"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>Iframe URL</Label>
              <Input
                value={form.iframe_url}
                onChange={(e) => update("iframe_url", e.target.value)}
                placeholder="Optional embed URL"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>Cover image URL</Label>
              <Input
                value={form.cover}
                onChange={(e) => update("cover", e.target.value)}
                placeholder="https://…/poster.jpg"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Genre</Label>
              <Input
                value={form.genre}
                onChange={(e) => update("genre", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Country</Label>
              <Input
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Stars / Cast</Label>
              <Input
                value={form.stars}
                onChange={(e) => update("stars", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Producer</Label>
              <Input
                value={form.producer}
                onChange={(e) => update("producer", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Release year</Label>
              <Input
                type="number"
                value={form.release_year}
                onChange={(e) => update("release_year", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Duration</Label>
              <Input
                value={form.duration}
                onChange={(e) => update("duration", e.target.value)}
                placeholder="e.g. 1h 42m"
              />
            </div>
            <div className="space-y-1">
              <Label>Quality</Label>
              <Input
                value={form.quality}
                onChange={(e) => update("quality", e.target.value)}
                placeholder="HD, 4K, …"
              />
            </div>
            <div className="space-y-1">
              <Label>Category ID</Label>
              <Input
                type="number"
                value={form.category_id}
                onChange={(e) => update("category_id", e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between sm:col-span-2 pt-2 border-t">
              <div>
                <Label>Approved</Label>
                <p className="text-xs text-muted-foreground">Visible publicly</p>
              </div>
              <Switch
                checked={form.is_approved}
                onCheckedChange={(v) => update("is_approved", Boolean(v))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.name || !form.video_url || saveMutation.isPending}
            >
              {saveMutation.isPending ? "Saving…" : editing ? "Save changes" : "Create movie"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
