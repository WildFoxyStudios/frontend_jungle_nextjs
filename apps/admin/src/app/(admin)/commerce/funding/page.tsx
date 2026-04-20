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

type FundingRow = { id: number } & Record<string, unknown>;

export default function FundingPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<FundingRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "funding", page],
    queryFn: () => adminApi.getAdminFunding({ page: String(page) }),
  });

  const del = useMutation({
    mutationFn: (id: number) => adminApi.deleteAdminFunding(id),
    onSuccess: () => { toast.success("Campaign deleted"); qc.invalidateQueries({ queryKey: ["admin", "funding"] }); },
    onError: () => toast.error("Failed to delete campaign"),
  });

  const columns: ColumnDef<FundingRow>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "goal_amount", header: "Goal", cell: ({ row }) => `${row.original.currency ?? "USD"} ${row.original.goal_amount}` },
    { accessorKey: "raised_amount", header: "Raised", cell: ({ row }) => `${row.original.currency ?? "USD"} ${row.original.raised_amount}` },
    {
      id: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const pct = Math.min(100, Math.round((Number(row.original.raised_amount ?? 0) / Math.max(1, Number(row.original.goal_amount ?? 1))) * 100));
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden w-20">
              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{pct}%</span>
          </div>
        );
      },
    },
    { accessorKey: "creator", header: "Creator", cell: ({ row }) => (row.original.creator as { username?: string })?.username ?? "—" },
    { accessorKey: "created_at", header: "Date", cell: ({ row }) => new Date(row.original.created_at as string).toLocaleDateString() },
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
    <AdminPageShell title="Funding Campaigns" description="Manage crowdfunding campaigns created by users.">
      <DataTable
        data={(data?.data ?? []) as FundingRow[]}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search campaigns…"
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        title={`Delete campaign "${pendingDelete?.title as string}"?`}
        description="This will permanently remove the campaign and all associated donations."
        confirmText="Delete campaign"
        variant="destructive"
        onConfirm={async () => { if (pendingDelete) await del.mutateAsync(pendingDelete.id); }}
      />
    </AdminPageShell>
  );
}
