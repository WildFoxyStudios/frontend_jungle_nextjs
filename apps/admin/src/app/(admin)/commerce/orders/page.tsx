"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Badge } from "@jungle/ui";
import type { ColumnDef } from "@tanstack/react-table";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary", confirmed: "default", shipped: "default",
  delivered: "default", cancelled: "destructive", refunded: "outline",
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", page],
    queryFn: () => adminApi.getAdminOrders({ page: String(page) }),
  });

  const columns: ColumnDef<{ id: number } & Record<string, unknown>>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "buyer", header: "Buyer", cell: ({ row }) => (row.original.buyer as { username?: string })?.username ?? "—" },
    { accessorKey: "seller", header: "Seller", cell: ({ row }) => (row.original.seller as { username?: string })?.username ?? "—" },
    { accessorKey: "total", header: "Total", cell: ({ row }) => `${row.original.currency ?? "USD"} ${row.original.total}` },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.status as string] ?? "default"}>{row.original.status as string}</Badge> },
    { accessorKey: "created_at", header: "Date", cell: ({ row }) => new Date(row.original.created_at as string).toLocaleDateString() },
  ];

  return (
    <AdminPageShell title="Orders">
      <DataTable
        data={(data?.data ?? []) as ({ id: number } & Record<string, unknown>)[]}
        columns={columns}
        isLoading={isLoading}
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />
    </AdminPageShell>
  );
}
