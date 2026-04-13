"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@jungle/ui";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export default function StoriesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "stories", page],
    queryFn: () => adminApi.getAdminStories({ page: String(page) }),
  });

  const columns: ColumnDef<Record<string, unknown> & { id: number }>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "publisher", header: "User", cell: ({ row }) => (row.original.publisher as { username?: string })?.username ?? "—" },
    { accessorKey: "view_count", header: "Views" },
    { accessorKey: "expires_at", header: "Expires", cell: ({ row }) => new Date(row.original.expires_at as string).toLocaleString() },
    { accessorKey: "created_at", header: "Created", cell: ({ row }) => new Date(row.original.created_at as string).toLocaleDateString() },
    {
      id: "actions", header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={async () => {
            await adminApi.hideAdminStory(row.original.id as number);
            toast.success("Hidden"); refetch();
          }}>Hide</Button>
          <Button variant="destructive" size="sm" onClick={async () => {
            await adminApi.deleteAdminStory(row.original.id as number);
            toast.success("Deleted"); refetch();
          }}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageShell title="Stories">
      <DataTable
        data={(data?.data ?? []) as (Record<string, unknown> & { id: number })[]}
        columns={columns}
        isLoading={isLoading}
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />
    </AdminPageShell>
  );
}
