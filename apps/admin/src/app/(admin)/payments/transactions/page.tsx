"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import type { Transaction } from "@jungle/api-client";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@jungle/ui";
import { DataTable } from "@/components/data-table/DataTable";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

const columns: ColumnDef<Transaction>[] = [
  { accessorKey: "id", header: "ID", size: 60 },
  { accessorKey: "type", header: "Type", cell: ({ getValue }) => <Badge variant="secondary">{String(getValue())}</Badge> },
  { accessorKey: "amount", header: "Amount", cell: ({ row }) => `${row.original.currency} ${row.original.amount}` },
  { accessorKey: "gateway", header: "Gateway" },
  { accessorKey: "status", header: "Status", cell: ({ getValue }) => (
    <Badge variant={getValue() === "completed" ? "default" : getValue() === "failed" ? "destructive" : "secondary"}>
      {String(getValue())}
    </Badge>
  )},
  { accessorKey: "created_at", header: "Date", cell: ({ getValue }) => new Date(String(getValue())).toLocaleDateString() },
];

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "transactions", page],
    queryFn: () => adminApi.getWithdrawals({ page: String(page) }),
  });

  return (
    <AdminPageShell title="Transactions">
      <DataTable
        data={(data?.data ?? []) as Transaction[]}
        columns={columns}
        isLoading={isLoading}
        pagination={{ page, total: data?.meta.total ?? 0, perPage: 20, onPageChange: setPage }}
      />
    </AdminPageShell>
  );
}
