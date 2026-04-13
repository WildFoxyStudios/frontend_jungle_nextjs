"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@jungle/ui";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export default function JobsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "jobs", page],
    queryFn: () => adminApi.getAdminJobs({ page: String(page) }),
  });

  const columns: ColumnDef<{ id: number } & Record<string, unknown>>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "location", header: "Location" },
    { accessorKey: "poster", header: "Posted By", cell: ({ row }) => (row.original.poster as { username?: string })?.username ?? "—" },
    { accessorKey: "created_at", header: "Date", cell: ({ row }) => new Date(row.original.created_at as string).toLocaleDateString() },
    {
      id: "actions", header: "Actions",
      cell: ({ row }) => (
        <Button variant="destructive" size="sm" onClick={async () => {
          await adminApi.deleteAdminJob(row.original.id as number);
          toast.success("Deleted"); refetch();
        }}>Delete</Button>
      ),
    },
  ];

  return (
    <AdminPageShell title="Jobs">
      <DataTable
        data={(data?.data ?? []) as ({ id: number } & Record<string, unknown>)[]}
        columns={columns}
        isLoading={isLoading}
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />
    </AdminPageShell>
  );
}
