"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Button, Badge } from "@jungle/ui";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export default function MoviesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "movies", page],
    queryFn: () => adminApi.getAdminMovies({ page: String(page) }),
  });

  const columns: ColumnDef<{ id: number } & Record<string, unknown>>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "genre", header: "Genre" },
    { accessorKey: "view_count", header: "Views" },
    { accessorKey: "is_featured", header: "Featured", cell: ({ row }) => row.original.is_featured ? <Badge>Featured</Badge> : null },
    { accessorKey: "created_at", header: "Date", cell: ({ row }) => new Date(row.original.created_at as string).toLocaleDateString() },
    {
      id: "actions", header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={async () => {
            await adminApi.approveAdminMovie(row.original.id as number);
            toast.success("Approved"); refetch();
          }}>Approve</Button>
          <Button size="sm" variant="secondary" onClick={async () => {
            await adminApi.featureAdminMovie(row.original.id as number);
            toast.success("Featured"); refetch();
          }}>Feature</Button>
          <Button size="sm" variant="destructive" onClick={async () => {
            await adminApi.deleteAdminMovie(row.original.id as number);
            toast.success("Deleted"); refetch();
          }}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageShell title="Movies">
      <DataTable
        data={(data?.data ?? []) as ({ id: number } & Record<string, unknown>)[]}
        columns={columns}
        isLoading={isLoading}
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />
    </AdminPageShell>
  );
}
