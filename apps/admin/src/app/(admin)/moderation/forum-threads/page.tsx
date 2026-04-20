"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import type { ColumnDef } from "@tanstack/react-table";
import { Button, ConfirmDialog } from "@jungle/ui";
import { DataTable } from "@/components/data-table/DataTable";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface ForumThread {
  id: number;
  forum_id: number;
  user_id: number;
  title: string;
  view_count: number;
  reply_count: number;
  created_at: string;
}

export default function ForumThreadsModerationPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "forum-threads", page],
    queryFn: () => adminApi.getForumThreads({ page: String(page), limit: "20" }),
  });

  const del = useMutation({
    mutationFn: (id: number) => adminApi.deleteForumThread(id),
    onSuccess: () => {
      toast.success("Thread deleted");
      qc.invalidateQueries({ queryKey: ["admin", "forum-threads"] });
    },
    onError: () => toast.error("Failed to delete thread"),
  });

  const threads = (data?.data ?? []) as ForumThread[];

  const columns: ColumnDef<ForumThread>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "forum_id", header: "Forum ID", size: 90 },
    { accessorKey: "user_id", header: "User ID", size: 90 },
    {
      accessorKey: "reply_count",
      header: "Replies",
      size: 80,
      cell: ({ getValue }) => (getValue() as number).toLocaleString(),
    },
    {
      accessorKey: "view_count",
      header: "Views",
      size: 80,
      cell: ({ getValue }) => (getValue() as number).toLocaleString(),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => setPendingId(row.original.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell
      title="Forum Thread Moderation"
      description="Review and remove forum threads that violate community guidelines."
    >
      <DataTable
        data={threads}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search threads…"
        pagination={{ page, total: data?.meta.total ?? 0, perPage: 20, onPageChange: setPage }}
      />

      <ConfirmDialog
        open={pendingId !== null}
        onOpenChange={(o) => { if (!o) setPendingId(null); }}
        title="Delete this thread?"
        description="All replies within this thread will also be permanently removed."
        confirmText="Delete thread"
        variant="destructive"
        onConfirm={async () => {
          if (pendingId) await del.mutateAsync(pendingId);
        }}
      />
    </AdminPageShell>
  );
}
