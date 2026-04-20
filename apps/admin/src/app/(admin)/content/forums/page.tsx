"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Button, ConfirmDialog } from "@jungle/ui";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";

type ForumRow = { id: number } & Record<string, unknown>;

export default function ForumsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<ForumRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "forums", page],
    queryFn: () => adminApi.getAdminForums({ page: String(page) }),
  });

  const del = useMutation({
    mutationFn: (id: number) => adminApi.deleteAdminForum(id),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "forums"] }); },
    onError: () => toast.error("Failed to delete"),
  });

  const columns: ColumnDef<ForumRow>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "thread_count", header: "Threads" },
    {
      accessorKey: "last_post_at",
      header: "Last Post",
      cell: ({ row }) => row.original.last_post_at ? new Date(row.original.last_post_at as string).toLocaleDateString() : "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/content/forums/${row.original.id}/edit`}><Pencil className="h-3.5 w-3.5" /></Link>
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setPendingDelete(row.original)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageShell
      title="Forums"
      actions={
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/content/forums/create"><Plus className="h-4 w-4" /> New Forum</Link>
        </Button>
      }
    >
      <DataTable
        data={(data?.data ?? []) as ForumRow[]}
        columns={columns}
        isLoading={isLoading}
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        title={`Delete forum "${pendingDelete?.name as string}"?`}
        description="All threads and replies in this forum will also be removed."
        confirmText="Delete forum"
        variant="destructive"
        onConfirm={async () => { if (pendingDelete) await del.mutateAsync(pendingDelete.id); }}
      />
    </AdminPageShell>
  );
}
