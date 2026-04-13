"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ModerationQueue } from "@/components/admin/ModerationQueue";

export default function PendingBlogsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "pending-blogs"],
    queryFn: () => adminApi.getPendingBlogs(),
  });

  return (
    <AdminPageShell title="Pending Blogs">
      <ModerationQueue
        items={(data?.data ?? []) as { id: number; title?: string; content?: string; created_at?: string }[]}
        isLoading={isLoading}
        onApprove={(id) => adminApi.approveBlog(id)}
        onReject={(id) => adminApi.rejectBlog(id)}
        onRefetch={refetch}
      />
    </AdminPageShell>
  );
}
