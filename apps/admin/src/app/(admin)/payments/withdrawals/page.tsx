"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export default function WithdrawalsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "withdrawals"],
    queryFn: () => adminApi.getWithdrawals(),
  });

  return (
    <AdminPageShell title="Withdrawal Requests">
      <ModerationQueue
        items={(data?.data ?? []) as { id: number; title?: string; content?: string; created_at?: string }[]}
        isLoading={isLoading}
        onApprove={(id) => adminApi.approveWithdrawal(id)}
        onReject={(id) => adminApi.rejectWithdrawal(id)}
        onRefetch={refetch}
      />
    </AdminPageShell>
  );
}
