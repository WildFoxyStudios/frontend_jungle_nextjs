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
  const [status, setStatus] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "monetization", page, status],
    queryFn: () => adminApi.getMonetizationSubscriptions({ page: String(page), ...(status ? { status } : {}) }),
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
    <AdminPageShell
      title="Content Monetization"
      description="Creator subscription management — revenue per creator and payout status."
      actions={
        <select
          className="text-sm border rounded px-2 py-1 bg-background"
          value={status ?? ""}
          onChange={(e) => { setStatus(e.target.value || undefined); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      }
    >
      <DataTable
        data={(data?.data ?? []) as ({ id: number } & Record<string, unknown>)[]}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search subscriptions…"
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />
    </AdminPageShell>
  );
}
