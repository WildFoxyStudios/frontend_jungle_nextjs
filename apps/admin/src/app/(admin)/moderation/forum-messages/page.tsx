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

interface ForumReply {
  id: number;
  thread_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

export default function ForumMessagesModerationPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "forum-replies", page],
    queryFn: () => adminApi.getForumReplies({ page: String(page), limit: "20" }),
  });

  const del = useMutation({
    mutationFn: (id: number) => adminApi.deleteForumReply(id),
    onSuccess: () => {
      toast.success("Reply deleted");
      qc.invalidateQueries({ queryKey: ["admin", "forum-replies"] });
    },
    onError: () => toast.error("Failed to delete reply"),
  });

  const replies = (data?.data ?? []) as ForumReply[];

  const columns: ColumnDef<ForumReply>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "thread_id", header: "Thread ID", size: 90 },
    { accessorKey: "user_id", header: "User ID", size: 90 },
    {
      accessorKey: "content",
      header: "Content",
      cell: ({ getValue }) => {
        const text = String(getValue() ?? "");
        return <span className="line-clamp-2 max-w-xs text-sm">{text}</span>;
      },
    },
    {
      accessorKey: "created_at",
      header: "Posted",
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
      title="Forum Reply Moderation"
      description="Review and remove forum replies that violate community guidelines."
    >
      <DataTable
        data={replies}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search replies…"
        pagination={{ page, total: data?.meta.total ?? 0, perPage: 20, onPageChange: setPage }}
      />

      <ConfirmDialog
        open={pendingId !== null}
        onOpenChange={(o) => { if (!o) setPendingId(null); }}
        title="Delete this reply?"
        description="This reply will be permanently removed."
        confirmText="Delete reply"
        variant="destructive"
        onConfirm={async () => {
          if (pendingId) await del.mutateAsync(pendingId);
        }}
      />
    </AdminPageShell>
  );
}
