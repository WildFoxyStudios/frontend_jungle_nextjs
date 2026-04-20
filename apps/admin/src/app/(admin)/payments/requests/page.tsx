"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@jungle/ui";
import { DataTable } from "@/components/data-table/DataTable";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

interface PaymentTransaction {
  id: number;
  user_id: number;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  created_at: string;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  pending: "secondary",
  failed: "destructive",
  refunded: "outline",
};

const columns: ColumnDef<PaymentTransaction>[] = [
  { accessorKey: "id", header: "ID", size: 70 },
  { accessorKey: "user_id", header: "User ID", size: 90 },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => `${row.original.currency} ${Number(row.original.amount).toFixed(2)}`,
  },
  { accessorKey: "provider", header: "Gateway" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const s = String(getValue());
      return (
        <Badge variant={STATUS_VARIANT[s] ?? "secondary"} className="capitalize">
          {s}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
  },
];

export default function PaymentRequestsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>("pending");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "payment-transactions", page, status],
    queryFn: () => adminApi.getAdminTransactions({ page: String(page), limit: "20", status }),
  });

  const transactions = (data?.data ?? []) as PaymentTransaction[];

  return (
    <AdminPageShell
      title="Payment Requests"
      description="Monitor payment transactions across all gateways. Pending transactions are shown by default."
      actions={
        <select
          className="text-sm border rounded px-2 py-1 bg-background"
          value={status ?? ""}
          onChange={(e) => { setStatus(e.target.value || undefined); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      }
    >
      <DataTable
        data={transactions}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search transactions…"
        pagination={{ page, total: data?.meta.total ?? 0, perPage: 20, onPageChange: setPage }}
      />
    </AdminPageShell>
  );
}
