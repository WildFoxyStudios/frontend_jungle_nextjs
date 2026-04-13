"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export default function UserReportsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "user-reports"],
    queryFn: () => adminApi.getReports({ type: "user" }),
  });

  return (
    <AdminPageShell title="User Reports">
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
