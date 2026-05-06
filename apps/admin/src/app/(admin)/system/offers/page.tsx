"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, cursorPagerTotal } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { useAdminCursorPages } from "@/hooks/useAdminCursorPages";
import { Button, ConfirmDialog } from "@jungle/ui";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";

type OfferRow = { id: number } & Record<string, unknown>;

export default function OffersPage() {
  const qc = useQueryClient();
  const { sentCursor, page, goToPage, reset } = useAdminCursorPages();
  const [pendingDelete, setPendingDelete] = useState<OfferRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "offers", sentCursor ?? "head"],
    queryFn: () =>
      adminApi.getAdminOffers({
        limit: "20",
        ...(sentCursor ? { cursor: sentCursor } : {}),
      }),
  });

  const del = useMutation({
    mutationFn: (id: number) => adminApi.deleteAdminOffer(id),
    onSuccess: () => {
      toast.success("Offer deleted");
      reset();
      qc.invalidateQueries({ queryKey: ["admin", "offers"] });
    },
    onError: () => toast.error("Failed to delete offer"),
  });

  const columns: ColumnDef<OfferRow>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    {
      accessorKey: "offer_text",
      header: "Title",
      cell: ({ row }) => String(row.original.offer_text ?? row.original.title ?? "—"),
    },
    {
      accessorKey: "discount_percent",
      header: "Discount",
      cell: ({ row }) => {
        const v = row.original.discount_percent ?? row.original.discount_value;
        return v != null && v !== "" ? `${v}%` : "—";
      },
    },
    { accessorKey: "seller", header: "Seller", cell: ({ row }) => (row.original.seller as { username?: string })?.username ?? "—" },
    { accessorKey: "expires_at", header: "Expires", cell: ({ row }) => row.original.expires_at ? new Date(row.original.expires_at as string).toLocaleDateString() : "—" },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <Button variant="destructive" size="sm" onClick={() => setPendingDelete(row.original)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell title="Offers" description="Manage discount offers submitted by sellers.">
      <DataTable
        data={(data?.data ?? []) as OfferRow[]}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search offers…"
        pagination={data
          ? {
              page,
              total: cursorPagerTotal(page, 20, data.data.length, data.meta.has_more, data.meta.total),
              perPage: 20,
              onPageChange: (n) => goToPage(n, data.meta.cursor),
            }
          : undefined}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        title={`Delete offer "${String(pendingDelete?.offer_text ?? pendingDelete?.title ?? "")}"?`}
        description="This offer will be permanently removed."
        confirmText="Delete offer"
        variant="destructive"
        onConfirm={async () => { if (pendingDelete) await del.mutateAsync(pendingDelete.id); }}
      />
    </AdminPageShell>
  );
}
