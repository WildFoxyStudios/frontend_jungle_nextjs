"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Badge } from "@jungle/ui";
import type { ColumnDef } from "@tanstack/react-table";

export default function MonetizationPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "monetization", page],
    queryFn: () => adminApi.getMonetizationSubscriptions({ page: String(page) }),
  });

  const columns: ColumnDef<{ id: number } & Record<string, unknown>>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "creator", header: "Creator", cell: ({ row }) => (row.original.creator as { username?: string })?.username ?? "—" },
    { accessorKey: "subscriber", header: "Subscriber", cell: ({ row }) => (row.original.subscriber as { username?: string })?.username ?? "—" },
    { accessorKey: "tier_name", header: "Tier" },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => `${row.original.currency ?? "USD"} ${row.original.amount}` },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant={row.original.status === "active" ? "default" : "secondary"}>{row.original.status as string}</Badge> },
    { accessorKey: "started_at", header: "Started", cell: ({ row }) => new Date(row.original.started_at as string).toLocaleDateString() },
  ];

  return (
    <AdminPageShell title="Content Monetization" description="Creator subscription management">
      <DataTable
        data={(data?.data ?? []) as ({ id: number } & Record<string, unknown>)[]}
        columns={columns}
        isLoading={isLoading}
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />
    </AdminPageShell>
  );
}
