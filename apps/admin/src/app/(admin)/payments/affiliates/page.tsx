"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Badge } from "@jungle/ui";
import type { ColumnDef } from "@tanstack/react-table";

export default function AffiliatesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "affiliates", page],
    queryFn: () => adminApi.getAffiliates({ page: String(page) }),
  });

  const columns: ColumnDef<{ id: number } & Record<string, unknown>>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "user", header: "Affiliate", cell: ({ row }) => (row.original.user as { username?: string })?.username ?? "—" },
    { accessorKey: "referred", header: "Referred", cell: ({ row }) => (row.original.referred as { username?: string })?.username ?? "—" },
    { accessorKey: "amount", header: "Commission", cell: ({ row }) => `$${row.original.amount ?? 0}` },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant={row.original.status === "paid" ? "default" : "secondary"}>{row.original.status as string}</Badge> },
    { accessorKey: "created_at", header: "Date", cell: ({ row }) => new Date(row.original.created_at as string).toLocaleDateString() },
  ];

  return (
    <AdminPageShell title="Affiliates">
      <DataTable
        data={(data?.data ?? []) as ({ id: number } & Record<string, unknown>)[]}
        columns={columns}
        isLoading={isLoading}
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />
    </AdminPageShell>
  );
}
