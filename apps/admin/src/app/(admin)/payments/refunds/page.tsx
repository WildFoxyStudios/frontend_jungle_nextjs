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

interface RefundRequest {
  id: number;
  user_id?: number;
  order_id?: number;
  amount?: number;
  currency?: string;
  reason?: string;
  status?: string;
  type?: string;
  created_at?: string;
}

export default function RefundsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<{ id: number; action: "approve" | "reject" } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "refunds", page],
    queryFn: () => adminApi.getRefundRequests({ page: String(page) }),
  });

  const act = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "approve" | "reject" }) =>
      action === "approve" ? adminApi.approveRefund(id) : adminApi.rejectRefund(id),
    onSuccess: (_, { action }) => {
      toast.success(action === "approve" ? "Refund approved" : "Refund rejected");
      qc.invalidateQueries({ queryKey: ["admin", "refunds"] });
    },
    onError: () => toast.error("Action failed"),
  });

  const refunds = (data?.data ?? []) as RefundRequest[];

  const columns: ColumnDef<RefundRequest>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "user_id", header: "User ID", size: 90 },
    { accessorKey: "order_id", header: "Order ID", size: 90 },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ getValue }) => (
        <Badge variant="secondary" className="capitalize text-xs">{String(getValue() ?? "—")}</Badge>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => row.original.amount != null
        ? `${row.original.currency ?? ""} ${Number(row.original.amount).toFixed(2)}` : "—",
    },
    { accessorKey: "reason", header: "Reason" },
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
      title="Refund Requests"
      description="Review and process Pro subscription and order refund requests."
    >
      <DataTable
        data={refunds}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search refunds…"
        pagination={{ page, total: data?.meta.total ?? 0, perPage: 20, onPageChange: setPage }}
      />

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(o) => { if (!o) setPending(null); }}
        title={pending?.action === "approve" ? "Approve this refund?" : "Reject this refund?"}
        description={pending?.action === "approve"
          ? "The refund will be processed and funds returned to the user."
          : "The refund request will be rejected. The user will be notified."}
        confirmText={pending?.action === "approve" ? "Approve refund" : "Reject refund"}
        variant={pending?.action === "reject" ? "destructive" : "default"}
        onConfirm={async () => { if (pending) await act.mutateAsync(pending); }}
      />
    </AdminPageShell>
  );
}
