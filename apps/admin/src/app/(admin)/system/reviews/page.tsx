"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@jungle/ui";
import { Star } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

export default function ReviewsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "reviews", page],
    queryFn: () => adminApi.getAdminReviews({ page: String(page) }),
  });

  const columns: ColumnDef<{ id: number } & Record<string, unknown>>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    { accessorKey: "user", header: "Reviewer", cell: ({ row }) => (row.original.user as { username?: string })?.username ?? "—" },
    { accessorKey: "rating", header: "Rating", cell: ({ row }) => <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />{Number(row.original.rating)}</span> },
    { accessorKey: "comment", header: "Comment", cell: ({ row }) => <span className="truncate max-w-xs block">{(row.original.comment as string)?.slice(0, 60) ?? "—"}</span> },
    { accessorKey: "created_at", header: "Date", cell: ({ row }) => new Date(row.original.created_at as string).toLocaleDateString() },
    {
      id: "actions", header: "Actions",
      cell: ({ row }) => (
        <Button variant="destructive" size="sm" onClick={async () => { await adminApi.deleteAdminReview(row.original.id as number); toast.success("Deleted"); refetch(); }}>Delete</Button>
      ),
    },
  ];

  return (
    <AdminPageShell title="Reviews">
      <DataTable
        data={(data?.data ?? []) as ({ id: number } & Record<string, unknown>)[]}
        columns={columns}
        isLoading={isLoading}
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 20, onPageChange: setPage } : undefined}
      />
    </AdminPageShell>
  );
}
