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
import { ShieldMinus, StarOff } from "lucide-react";

interface Action {
  label: string;
  icon: React.ElementType;
  fn: (id: number) => Promise<void>;
  confirm: (u: User) => string;
}

const REMOVE_ADMIN: Action = {
  label: "Remove Admin",
  icon: ShieldMinus,
  fn: (id) => adminApi.removeUserAdmin(id),
  confirm: (u) => `Remove admin role from @${u.username}?`,
};

const REMOVE_PRO: Action = {
  label: "Remove Pro",
  icon: StarOff,
  fn: (id) => adminApi.removeUserPro(id),
  confirm: (u) => `Remove Pro badge from @${u.username}?`,
};

export default function UserRolesPage() {
  const qc = useQueryClient();
  const [pending, setPending] = useState<{ user: User; action: Action } | null>(null);
  const [adminPage, setAdminPage] = useState(1);
  const [proPage, setProPage] = useState(1);

  const { data: adminData, isLoading: adminLoading } = useQuery({
    queryKey: ["admin", "users", "admins", adminPage],
    queryFn: () => adminApi.getUsers({ status: "admin", page: adminPage, limit: 20 }),
  });

  const { data: proData, isLoading: proLoading } = useQuery({
    queryKey: ["admin", "users", "pro", proPage],
    queryFn: () => adminApi.getUsers({ status: "pro", page: proPage, limit: 20 }),
  });

  const doAction = useMutation({
    mutationFn: ({ action, id }: { action: Action; id: number }) => action.fn(id),
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => toast.error("Failed to update role"),
  });

  const makeColumns = (action: Action): ColumnDef<User>[] => [
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
      id: "badge",
      header: "Role",
      cell: () => (
        <Badge variant={action === REMOVE_ADMIN ? "default" : "secondary"}>
          {action === REMOVE_ADMIN ? "Admin" : "Pro"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          className="gap-1 text-destructive hover:text-destructive"
          onClick={() => setPending({ user: row.original, action })}
        >
          <action.icon className="h-3.5 w-3.5" /> {action.label}
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell
      title="User Roles"
      description="Manage admin and Pro memberships. Use the individual user page to grant roles."
    >
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold mb-3">Admins</h2>
          <DataTable
            data={(adminData?.data ?? []) as User[]}
            columns={makeColumns(REMOVE_ADMIN)}
            isLoading={adminLoading}
            pagination={{ page: adminPage, total: adminData?.meta.total ?? 0, perPage: 20, onPageChange: setAdminPage }}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Pro Members</h2>
          <DataTable
            data={(proData?.data ?? []) as User[]}
            columns={makeColumns(REMOVE_PRO)}
            isLoading={proLoading}
            pagination={{ page: proPage, total: proData?.meta.total ?? 0, perPage: 20, onPageChange: setProPage }}
          />
        </div>
      </div>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(o) => { if (!o) setPending(null); }}
        title={pending ? pending.action.confirm(pending.user) : ""}
        description="This action can be reversed from the same page."
        confirmText={pending?.action.label ?? "Confirm"}
        variant="destructive"
        onConfirm={async () => {
          if (pending) await doAction.mutateAsync({ action: pending.action, id: pending.user.id });
        }}
      />
    </AdminPageShell>
  );
}
