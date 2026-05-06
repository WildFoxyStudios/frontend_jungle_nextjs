"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Avatar, AvatarFallback, AvatarImage, Badge, Skeleton } from "@jungle/ui";

export default function OnlineUsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "online-users"],
    queryFn: () => adminApi.getOnlineUsers(),
    refetchInterval: 30_000, // refresh every 30s
  });

  const users = ((data as { data?: { id: number; username: string; first_name: string; last_name: string; avatar: string; last_seen: string }[] } | undefined)?.data ?? []);

  return (
    <AdminPageShell title="Online Users" description={`${users.length} users currently online`}>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <div className="border bg-card divide-y-2 divide-foreground shadow-sm">
          {users.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm font-bold uppercase tracking-wide">No users online right now.</p>
          )}
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.first_name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
              <Badge variant="default" className="text-xs">Online</Badge>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
