"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import type { ColumnDef } from "@tanstack/react-table";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import { Badge, Button, Tabs, TabsList, TabsTrigger } from "@jungle/ui";
import { toast } from "sonner";
import { CheckCheck } from "lucide-react";

interface Report {
  id: number;
  type?: string;
  target_id?: number;
  reporter_id?: number;
  reason?: string;
  status?: string;
  created_at?: string;
}

const TABS = [
  { value: "all", label: "All" },
  { value: "post", label: "Posts" },
  { value: "comment", label: "Comments" },
  { value: "user", label: "Users" },
  { value: "page", label: "Pages" },
  { value: "group", label: "Groups" },
];

export default function ReportsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reports", tab, page],
    queryFn: () => adminApi.getReports(tab !== "all" ? { type: tab } : undefined),
  });

  const resolve = useMutation({
    mutationFn: ({ id, action }: { id: number; action: string }) =>
      adminApi.resolveReport(id, action),
    onSuccess: () => {
      toast.success("Report resolved");
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
    onError: () => toast.error("Failed to resolve report"),
  });

  const reports = (data?.data ?? []) as Report[];

  const columns: ColumnDef<Report>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ getValue }) => (
        <Badge variant="secondary" className="capitalize">{String(getValue() ?? "—")}</Badge>
      ),
    },
    { accessorKey: "target_id", header: "Target ID", size: 90 },
    { accessorKey: "reporter_id", header: "Reporter ID", size: 100 },
    { accessorKey: "reason", header: "Reason" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => (
        <Badge
          variant={getValue() === "resolved" ? "default" : getValue() === "dismissed" ? "secondary" : "outline"}
          className="capitalize"
        >
          {String(getValue() ?? "open")}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ getValue }) => getValue() ? new Date(getValue() as string).toLocaleDateString() : "—",
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => resolve.mutate({ id: row.original.id, action: "approve" })}
          >
            Resolve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground"
            onClick={() => resolve.mutate({ id: row.original.id, action: "dismiss" })}
          >
            Dismiss
          </Button>
        </div>
      ),
    },
  ];

  const bulkActions = [
    {
      label: "Bulk Close",
      onAction: async (ids: number[]) => {
        await Promise.all(ids.map((id) => adminApi.resolveReport(id, "dismiss")));
        toast.success(`Closed ${ids.length} reports`);
        qc.invalidateQueries({ queryKey: ["admin", "reports"] });
      },
    },
  ];

  return (
    <AdminPageShell
      title="Reports Queue"
      description="Review content and user reports. Use tabs to filter by target type."
      actions={
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={async () => {
            await Promise.all(reports.map((r) => adminApi.resolveReport(r.id, "dismiss")));
            toast.success("All visible reports dismissed");
            qc.invalidateQueries({ queryKey: ["admin", "reports"] });
          }}
        >
          <CheckCheck className="h-3.5 w-3.5" /> Dismiss All Visible
        </Button>
      }
    >
      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <TabsList className="mb-4">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        data={reports}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search reports…"
        bulkActions={bulkActions}
        pagination={{ page, total: data?.meta.total ?? 0, perPage: 20, onPageChange: setPage }}
      />
    </AdminPageShell>
  );
}
