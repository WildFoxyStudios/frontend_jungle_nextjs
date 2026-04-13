"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ModerationQueue } from "@/components/admin/ModerationQueue";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@jungle/ui";

export default function ReportsPage() {
  const [type, setType] = useState<string>("all");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "reports", type],
    queryFn: () => adminApi.getReports(type !== "all" ? { type } : undefined),
  });

  return (
    <AdminPageShell
      title="Reports Queue"
      actions={
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="post">Posts</SelectItem>
            <SelectItem value="comment">Comments</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="page">Pages</SelectItem>
            <SelectItem value="group">Groups</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <ModerationQueue
        items={(data?.data ?? []) as { id: number; type?: string; content?: string; created_at?: string }[]}
        isLoading={isLoading}
        onApprove={(id) => adminApi.resolveReport(id, "approve")}
        onReject={(id) => adminApi.resolveReport(id, "dismiss")}
        onRefetch={refetch}
      />
    </AdminPageShell>
  );
}
