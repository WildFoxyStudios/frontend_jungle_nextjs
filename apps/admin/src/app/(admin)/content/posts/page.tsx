"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Button, Badge } from "@jungle/ui";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export default function PostsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "all-posts", page],
    queryFn: () => adminApi.getAdminPosts({ page: String(page) }),
  });

  const columns: ColumnDef<{ id: number } & Record<string, unknown>>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "content", header: "Content", cell: ({ row }) => <span className="truncate max-w-xs block">{(row.original.content as string)?.slice(0, 80) ?? "—"}</span> },
    { accessorKey: "post_type", header: "Type", cell: ({ row }) => <Badge variant="secondary">{row.original.post_type as string}</Badge> },
    { accessorKey: "publisher", header: "Author", cell: ({ row }) => (row.original.publisher as { username?: string })?.username ?? "—" },
    { accessorKey: "like_count", header: "Likes" },
    { accessorKey: "created_at", header: "Date", cell: ({ row }) => new Date(row.original.created_at as string).toLocaleDateString() },
    {
      id: "actions", header: "Actions",
      cell: ({ row }) => (
        <Button variant="destructive" size="sm" onClick={async () => {
          await adminApi.deleteAdminPost(row.original.id as number);
          toast.success("Deleted"); refetch();
        }}>Delete</Button>
      ),
    },
  ];

  return (
    <AdminPageShell title="All Posts">
      <DataTable
        data={(data?.data ?? []) as ({ id: number } & Record<string, unknown>)[]}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search posts…"
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />
    </AdminPageShell>
  );
}
