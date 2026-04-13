"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "activity-log", page],
    queryFn: () => adminApi.getActivityLog({ page: String(page) }),
  });

  const columns: ColumnDef<{ id: number } & Record<string, unknown>>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "user", header: "User", cell: ({ row }) => (row.original.user as { username?: string })?.username ?? "—" },
    { accessorKey: "activity_type", header: "Action" },
    { accessorKey: "target_type", header: "Target Type" },
    { accessorKey: "created_at", header: "Time", cell: ({ row }) => new Date(row.original.created_at as string).toLocaleString() },
  ];

  return (
    <AdminPageShell title="Activity Log">
      <DataTable
        data={(data?.data ?? []) as ({ id: number } & Record<string, unknown>)[]}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search activities…"
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 50, onPageChange: setPage } : undefined}
      />
    </AdminPageShell>
  );
}
