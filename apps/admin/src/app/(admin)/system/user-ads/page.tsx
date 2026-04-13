"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Button, Badge } from "@jungle/ui";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export default function UserAdsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "user-ads", page],
    queryFn: () => adminApi.getUserAds({ page: String(page) }),
  });

  const columns: ColumnDef<{ id: number } & Record<string, unknown>>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "name", header: "Ad Name" },
    { accessorKey: "user", header: "Owner", cell: ({ row }) => (row.original.user as { username?: string })?.username ?? "—" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge variant={row.original.status === "active" ? "default" : "secondary"}>{row.original.status as string}</Badge> },
    { accessorKey: "impressions", header: "Impressions" },
    { accessorKey: "clicks", header: "Clicks" },
    {
      id: "actions", header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={async () => { await adminApi.toggleUserAd(row.original.id as number); toast.success("Toggled"); refetch(); }}>Toggle</Button>
          <Button variant="destructive" size="sm" onClick={async () => { await adminApi.deleteUserAd(row.original.id as number); toast.success("Deleted"); refetch(); }}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageShell title="User Ads">
      <DataTable
        data={(data?.data ?? []) as ({ id: number } & Record<string, unknown>)[]}
        columns={columns}
        isLoading={isLoading}
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />
    </AdminPageShell>
  );
}
