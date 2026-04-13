"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Badge } from "@jungle/ui";
import type { ColumnDef } from "@tanstack/react-table";

const PRO_LABELS: Record<number, string> = { 1: "Star", 2: "Hot", 3: "Ultima", 4: "VIP" };

export default function ProMembersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pro-members", page],
    queryFn: () => adminApi.getProMembers({ page: String(page) }),
  });

  const columns: ColumnDef<{ id: number } & Record<string, unknown>>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "username", header: "Username" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "is_pro", header: "Plan", cell: ({ row }) => <Badge>{PRO_LABELS[row.original.is_pro as number] ?? `Pro ${row.original.is_pro}`}</Badge> },
    { accessorKey: "pro_expires_at", header: "Expires", cell: ({ row }) => row.original.pro_expires_at ? new Date(row.original.pro_expires_at as string).toLocaleDateString() : "Lifetime" },
    { accessorKey: "created_at", header: "Member Since", cell: ({ row }) => new Date(row.original.created_at as string).toLocaleDateString() },
  ];

  return (
    <AdminPageShell title="Pro Members">
      <DataTable
        data={(data?.data ?? []) as ({ id: number } & Record<string, unknown>)[]}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search pro members…"
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />
    </AdminPageShell>
  );
}
