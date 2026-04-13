"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export default function PendingPostsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "pending-posts"],
    queryFn: () => adminApi.getPendingPosts(),
  });

  return (
    <AdminPageShell title="Pending Posts" description="Review and approve or reject posts awaiting moderation.">
      <ModerationQueue
        items={(data?.data ?? []) as { id: number; content?: string; created_at?: string }[]}
        isLoading={isLoading}
        onApprove={(id) => adminApi.approvePost(id)}
        onReject={(id) => adminApi.rejectPost(id)}
        onRefetch={refetch}
      />
    </AdminPageShell>
  );
}
