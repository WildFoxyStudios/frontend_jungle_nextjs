"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, cursorPagerTotal } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { useAdminCursorPages } from "@/hooks/useAdminCursorPages";
import { Badge, Button, ConfirmDialog } from "@jungle/ui";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

const PRO_LABELS: Record<number, string> = { 1: "Star", 2: "Hot", 3: "Ultima", 4: "VIP" };

type ProMember = { id: number } & Record<string, unknown>;

export default function ProMembersPage() {
  const qc = useQueryClient();
  const { sentCursor, page, goToPage, reset } = useAdminCursorPages();
  const [pendingRemove, setPendingRemove] = useState<ProMember | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pro-members", sentCursor ?? "head"],
    queryFn: () =>
      adminApi.getProMembers({
        limit: "20",
        ...(sentCursor ? { cursor: sentCursor } : {}),
      }),
  });

  const removePro = useMutation({
    mutationFn: (id: number) => adminApi.removeUserPro(id),
    onSuccess: () => {
      toast.success("Pro membership removed");
      reset();
      qc.invalidateQueries({ queryKey: ["admin", "pro-members"] });
    },
    onError: () => toast.error("Failed to remove Pro"),
  });

  const columns: ColumnDef<ProMember>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => (
        <Link href={`/users/${row.original.id}`} className="font-medium hover:underline">
          @{String(row.original.username ?? "—")}
        </Link>
      ),
    },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "is_pro",
      header: "Plan",
      cell: ({ getValue }) => (
        <Badge>{PRO_LABELS[getValue() as number] ?? `Pro ${getValue()}`}</Badge>
      ),
    },
    {
      accessorKey: "pro_expires_at",
      header: "Expires",
      cell: ({ getValue }) =>
        getValue() ? new Date(getValue() as string).toLocaleDateString() : "Lifetime",
    },
    {
      accessorKey: "created_at",
      header: "Member Since",
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="destructive"
          className="text-xs"
          onClick={() => setPendingRemove(row.original)}
        >
          Remove Pro
        </Button>
      ),
    },
  ];

  return (
    <AdminPageShell title="Pro Members" description="Manage active Pro subscriptions.">
      <DataTable
        data={(data?.data ?? []) as ProMember[]}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search pro members…"
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
        open={pendingRemove !== null}
        onOpenChange={(o) => { if (!o) setPendingRemove(null); }}
        title={`Remove Pro from @${pendingRemove?.username as string}?`}
        description="Their Pro badge and benefits will be revoked immediately."
        confirmText="Remove Pro"
        variant="destructive"
        onConfirm={async () => { if (pendingRemove) await removePro.mutateAsync(pendingRemove.id); }}
      />
    </AdminPageShell>
  );
}
