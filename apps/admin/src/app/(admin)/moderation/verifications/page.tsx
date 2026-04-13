"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export default function VerificationsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "verifications"],
    queryFn: () => adminApi.getVerificationRequests(),
  });

  return (
    <AdminPageShell title="Verification Requests">
      <ModerationQueue
        items={(data?.data ?? []) as { id: number; title?: string; created_at?: string }[]}
        isLoading={isLoading}
        onApprove={(id) => adminApi.approveVerification(id)}
        onReject={(id) => adminApi.rejectVerification(id)}
        onRefetch={refetch}
      />
    </AdminPageShell>
  );
}
