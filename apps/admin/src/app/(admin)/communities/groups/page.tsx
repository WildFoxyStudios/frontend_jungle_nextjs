"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Button, Badge } from "@jungle/ui";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export default function GroupsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "groups", page],
    queryFn: () => adminApi.getAdminGroups({ page: String(page) }),
  });

  const columns: ColumnDef<{ id: number } & Record<string, unknown>>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "privacy", header: "Privacy", cell: ({ row }) => <Badge variant="outline" className="capitalize">{row.original.privacy as string}</Badge> },
    { accessorKey: "member_count", header: "Members" },
    { accessorKey: "created_at", header: "Created", cell: ({ row }) => new Date(row.original.created_at as string).toLocaleDateString() },
    {
      id: "actions", header: "Actions",
      cell: ({ row }) => (
        <Button variant="destructive" size="sm" onClick={async () => {
          await adminApi.deleteAdminGroup(row.original.id as number);
          toast.success("Deleted"); refetch();
        }}>Delete</Button>
      ),
    },
  ];

  return (
    <AdminPageShell title="Groups">
      <DataTable
        data={(data?.data ?? []) as ({ id: number } & Record<string, unknown>)[]}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search groups…"
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />
    </AdminPageShell>
  );
}
