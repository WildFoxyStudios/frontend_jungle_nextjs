"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import type { ColumnDef } from "@tanstack/react-table";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Badge, Button, ConfirmDialog } from "@jungle/ui";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

interface BankReceipt {
  id: number;
  user_id?: number;
  amount?: number;
  currency?: string;
  status?: string;
  bank_name?: string;
  reference?: string;
  receipt_url?: string;
  created_at?: string;
}

export default function BankReceiptsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>("pending");
  const [pending, setPending] = useState<{ id: number; action: "approve" | "reject" } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "bank-receipts", page, status],
    queryFn: () => adminApi.getBankReceipts(status ? { status } : undefined),
  });

  const act = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" }) =>
      action === "approve" ? adminApi.approveBankReceipt(id) : adminApi.rejectBankReceipt(id),
    onSuccess: (_, { action }) => {
      toast.success(action === "approve" ? "Receipt approved" : "Receipt rejected");
      qc.invalidateQueries({ queryKey: ["admin", "bank-receipts"] });
    },
    onError: () => toast.error("Action failed"),
  });

  const receipts = (data?.data ?? []) as BankReceipt[];

  const columns: ColumnDef<BankReceipt>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "user_id", header: "User ID", size: 90 },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => row.original.amount != null
        ? `${row.original.currency ?? ""} ${Number(row.original.amount).toFixed(2)}` : "—",
    },
    { accessorKey: "bank_name", header: "Bank" },
    { accessorKey: "reference", header: "Reference" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => (
        <Badge
          variant={getValue() === "approved" ? "default" : getValue() === "rejected" ? "destructive" : "secondary"}
          className="capitalize"
        >
          {String(getValue() ?? "pending")}
        </Badge>
      ),
    },
    {
      accessorKey: "receipt_url",
      header: "Receipt",
      cell: ({ getValue }) =>
        getValue() ? (
          <a href={getValue() as string} target="_blank" rel="noopener noreferrer" className="text-primary text-xs underline">
            View
          </a>
        ) : "—",
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ getValue }) => getValue() ? new Date(getValue() as string).toLocaleDateString() : "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="gap-1 text-xs text-green-600 border-green-600 hover:bg-green-50"
            onClick={() => setPending({ id: row.original.id, action: "approve" })}>
            <CheckCircle2 className="h-3 w-3" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive border-destructive hover:bg-destructive/10"
            onClick={() => setPending({ id: row.original.id, action: "reject" })}>
            <XCircle className="h-3 w-3" /> Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageShell
      title="Bank Receipts"
      description="Review manual bank transfer receipts submitted by users."
      actions={
        <select
          className="text-sm border rounded px-2 py-1 bg-background"
          value={status ?? ""}
          onChange={(e) => { setStatus(e.target.value || undefined); setPage(1); }}
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      }
    >
      <DataTable
        data={receipts}
        columns={columns}
        isLoading={isLoading}
        pagination={{ page, total: data?.meta.total ?? 0, perPage: 20, onPageChange: setPage }}
      />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(o) => { if (!o) setPending(null); }}
        title={pending?.action === "approve" ? "Approve this receipt?" : "Reject this receipt?"}
        description={pending?.action === "approve"
          ? "The payment will be marked as completed and the user's order will be confirmed."
          : "The receipt will be rejected and the user will be notified."}
        confirmText={pending?.action === "approve" ? "Approve" : "Reject"}
        variant={pending?.action === "reject" ? "destructive" : "default"}
        onConfirm={async () => { if (pending) await act.mutateAsync(pending); }}
      />
    </AdminPageShell>
  );
}
