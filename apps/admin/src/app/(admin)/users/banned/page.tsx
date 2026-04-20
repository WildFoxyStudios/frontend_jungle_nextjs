"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import type { User } from "@jungle/api-client";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge, Button, ConfirmDialog } from "@jungle/ui";
import { DataTable } from "@/components/data-table/DataTable";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { toast } from "sonner";
import Link from "next/link";
import { UserCheck } from "lucide-react";

const columns: ColumnDef<User>[] = [
  { accessorKey: "id", header: "ID", size: 60 },
  {
    accessorKey: "username",
    header: "User",
    cell: ({ row }) => (
      <Link href={`/users/${row.original.id}`} className="font-medium hover:underline">
        {row.original.first_name} {row.original.last_name}
        <span className="text-muted-foreground ml-1 text-xs">@{row.original.username}</span>
      </Link>
    ),
  },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "created_at",
    header: "Joined",
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
  },
  {
    id: "status",
    header: "Status",
    cell: () => <Badge variant="destructive">Banned</Badge>,
  },
];

export default function BannedUsersPage() {
  const qc = useQueryClient();
  const [pendingUnban, setPendingUnban] = useState<User | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", "banned", page],
    queryFn: () => adminApi.getUsers({ status: "banned", page, limit: 20 }),
  });

  const unban = useMutation({
    mutationFn: (id: number) => adminApi.unbanUser(id),
    onSuccess: () => {
      toast.success("User unbanned");
      qc.invalidateQueries({ queryKey: ["admin", "users", "banned"] });
    },
    onError: () => toast.error("Failed to unban user"),
  });

  const users = (data?.data ?? []) as User[];
  const total = data?.meta.total ?? 0;

  const columnsWithAction: ColumnDef<User>[] = [
    ...columns,
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => setPendingUnban(row.original)}
        >
          <UserCheck className="h-3.5 w-3.5" /> Unban
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell
      title="Banned Users"
      description="Users who have been banned from the platform."
    >
      <DataTable
        data={users}
        columns={columnsWithAction}
        isLoading={isLoading}
        searchPlaceholder="Search banned users…"
        pagination={{ page, total, perPage: 20, onPageChange: setPage }}
      />

      <ConfirmDialog
        open={pendingUnban !== null}
        onOpenChange={(o) => { if (!o) setPendingUnban(null); }}
        title={`Unban @${pendingUnban?.username}?`}
        description="This user will regain access to the platform immediately."
        confirmText="Unban"
        onConfirm={async () => {
          if (pendingUnban) await unban.mutateAsync(pendingUnban.id);
        }}
      />
    </AdminPageShell>
  );
}
