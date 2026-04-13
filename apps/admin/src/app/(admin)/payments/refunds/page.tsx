"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export default function RefundsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "refunds"],
    queryFn: () => adminApi.getRefundRequests(),
  });

  return (
    <AdminPageShell title="Refund Requests">
      <ModerationQueue
        items={(data?.data ?? []) as { id: number; title?: string; created_at?: string }[]}
        isLoading={isLoading}
        onApprove={(id) => adminApi.approveRefund(id)}
        onReject={(id) => adminApi.rejectRefund(id)}
        onRefetch={refetch}
      />
    </AdminPageShell>
  );
}
