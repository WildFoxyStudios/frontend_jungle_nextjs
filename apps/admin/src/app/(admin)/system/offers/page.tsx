"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Button, ConfirmDialog } from "@jungle/ui";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";

type OfferRow = { id: number } & Record<string, unknown>;

export default function OffersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<OfferRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "offers", page],
    queryFn: () => adminApi.getAdminOffers({ page: String(page) }),
  });

  const del = useMutation({
    mutationFn: (id: number) => adminApi.deleteAdminOffer(id),
    onSuccess: () => { toast.success("Offer deleted"); qc.invalidateQueries({ queryKey: ["admin", "offers"] }); },
    onError: () => toast.error("Failed to delete offer"),
  });

  const columns: ColumnDef<OfferRow>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "discount_percent", header: "Discount", cell: ({ row }) => `${row.original.discount_percent}%` },
    { accessorKey: "seller", header: "Seller", cell: ({ row }) => (row.original.seller as { username?: string })?.username ?? "—" },
    { accessorKey: "expires_at", header: "Expires", cell: ({ row }) => row.original.expires_at ? new Date(row.original.expires_at as string).toLocaleDateString() : "—" },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setPendingDelete(row.original)}>
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
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        title={`Delete offer "${pendingDelete?.title as string}"?`}
        description="This offer will be permanently removed."
        confirmText="Delete offer"
        variant="destructive"
        onConfirm={async () => { if (pendingDelete) await del.mutateAsync(pendingDelete.id); }}
      />
    </AdminPageShell>
  );
}
