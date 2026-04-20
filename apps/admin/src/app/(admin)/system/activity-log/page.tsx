"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DataTable } from "@/components/data-table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Badge, Button, Card, CardContent, Input, Label,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@jungle/ui";
import { X } from "lucide-react";

const TARGET_TYPES = [
  "user",
  "post",
  "page",
  "group",
  "event",
  "product",
  "order",
  "blog",
  "forum",
  "live_stream",
  "withdrawal",
  "refund",
  "ai_provider",
] as const;

export default function ActivityLogPage() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [targetType, setTargetType] = useState<string>("");
  const [targetId, setTargetId] = useState<string>("");

  // Seed filters from the URL (populated by the AuditLogLink from other pages).
  useEffect(() => {
    const t = searchParams.get("target_type") ?? "";
    const i = searchParams.get("target_id") ?? "";
    if (t) setTargetType(t);
    if (i) setTargetId(i);
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "activity-log", page, targetType, targetId],
    queryFn: () => {
      const params: Record<string, string> = { page: String(page) };
      if (targetType) params["target_type"] = targetType;
      if (targetId) params["target_id"] = targetId;
      return adminApi.getActivityLog(params);
    },
  });

  const clearFilters = () => {
    setTargetType("");
    setTargetId("");
    setPage(1);
  };

  const hasFilter = targetType !== "" || targetId !== "";

  const columns: ColumnDef<{ id: number } & Record<string, unknown>>[] = [
    { accessorKey: "id", header: "ID", size: 60 },
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => (row.original.user as { username?: string })?.username ?? "—",
    },
    { accessorKey: "activity_type", header: "Action" },
    { accessorKey: "target_type", header: "Target type" },
    { accessorKey: "target_id", header: "Target ID" },
    {
      accessorKey: "created_at",
      header: "Time",
      cell: ({ row }) =>
        new Date(row.original.created_at as string).toLocaleString(),
    },
  ];

  return (
    <AdminPageShell title="Activity log" description="Audit trail of every admin and user action.">
      <Card>
        <CardContent className="p-4 grid gap-3 sm:grid-cols-[1fr_200px_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="target-type">Target type</Label>
            <Select value={targetType || "__any"} onValueChange={(v) => { setTargetType(v === "__any" ? "" : v); setPage(1); }}>
              <SelectTrigger id="target-type"><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__any">Any target type</SelectItem>
                {TARGET_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="target-id">Target ID</Label>
            <Input
              id="target-id"
              type="number"
              placeholder="any"
              value={targetId}
              onChange={(e) => { setTargetId(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex items-end">
            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5">
                <X className="h-4 w-4" /> Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {hasFilter && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Filters:</span>
          {targetType && (
            <Badge variant="secondary" className="gap-1">
              target_type=<span className="font-mono">{targetType}</span>
            </Badge>
          )}
          {targetId && (
            <Badge variant="secondary" className="gap-1">
              target_id=<span className="font-mono">{targetId}</span>
            </Badge>
          )}
        </div>
      )}

      <DataTable
        data={(data?.data ?? []) as ({ id: number } & Record<string, unknown>)[]}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search activities…"
        pagination={data ? { page, total: data.meta.total ?? 0, perPage: 50, onPageChange: setPage } : undefined}
      />
    </AdminPageShell>
  );
}
