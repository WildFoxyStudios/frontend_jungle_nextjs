"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Button, Badge, ConfirmDialog } from "@jungle/ui";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { ToggleLeft, Trash2 } from "lucide-react";

type AdRow = { id: number } & Record<string, unknown>;

export default function UserAdsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<AdRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "user-ads", page],
    queryFn: () => adminApi.getUserAds({ page: String(page) }),
  });

  const toggle = useMutation({
    mutationFn: (id: number) => adminApi.toggleUserAd(id),
    onSuccess: () => { toast.success("Ad toggled"); qc.invalidateQueries({ queryKey: ["admin", "user-ads"] }); },
    onError: () => toast.error("Failed to toggle ad"),
  });

  const del = useMutation({
    mutationFn: (id: number) => adminApi.deleteUserAd(id),
    onSuccess: () => { toast.success("Ad deleted"); qc.invalidateQueries({ queryKey: ["admin", "user-ads"] }); },
    onError: () => toast.error("Failed to delete ad"),
  });

  const columns: ColumnDef<AdRow>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "name", header: "Ad Name" },
    { accessorKey: "user", header: "Owner", cell: ({ row }) => (row.original.user as { username?: string })?.username ?? "—" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant={row.original.status === "active" ? "default" : "secondary"} className="capitalize">{row.original.status as string}</Badge> },
    { accessorKey: "impressions", header: "Views", cell: ({ getValue }) => Number(getValue() ?? 0).toLocaleString() },
    { accessorKey: "clicks", header: "Clicks", cell: ({ getValue }) => Number(getValue() ?? 0).toLocaleString() },
    {
      id: "ctr",
      header: "CTR",
      cell: ({ row }) => {
        const imp = Number(row.original.impressions ?? 0);
        const clk = Number(row.original.clicks ?? 0);
        return imp > 0 ? `${((clk / imp) * 100).toFixed(1)}%` : "—";
      },
    },
    {
      id: "actions", header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => toggle.mutate(row.original.id)} title="Toggle active"><ToggleLeft className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setPendingDelete(row.original)}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageShell title="User Ads" description="Manage and moderate user-submitted advertisements.">
      <DataTable
        data={(data?.data ?? []) as AdRow[]}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search ads…"
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        title={`Delete ad "${pendingDelete?.name as string}"?`}
        description="This ad will be permanently removed."
        confirmText="Delete"
        variant="destructive"
        onConfirm={async () => { if (pendingDelete) await del.mutateAsync(pendingDelete.id); }}
      />
    </AdminPageShell>
  );
}
