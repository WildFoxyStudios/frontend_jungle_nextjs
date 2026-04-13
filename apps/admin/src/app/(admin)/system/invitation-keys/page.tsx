"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Badge } from "@jungle/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface InvKey { id: number; code: string; user: { username: string }; used_by?: { username: string }; created_at: string }

export default function InvitationKeysPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "invitation-keys"], queryFn: () => adminApi.getInvitationKeys() });

  const columns: ColumnDef<InvKey>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "code", header: "Code", cell: ({ row }) => <code className="text-xs">{row.original.code}</code> },
    { accessorKey: "user", header: "Created By", cell: ({ row }) => row.original.user?.username ?? "—" },
    { accessorKey: "used_by", header: "Used By", cell: ({ row }) => row.original.used_by ? <Badge>{row.original.used_by.username}</Badge> : <span className="text-muted-foreground text-xs">Unused</span> },
    { accessorKey: "created_at", header: "Date", cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString() },
  ];

  return (
    <AdminPageShell title="Invitation Keys">
      <DataTable data={(data ?? []) as InvKey[]} columns={columns} isLoading={isLoading} searchPlaceholder="Search keys…" />
    </AdminPageShell>
  );
}
