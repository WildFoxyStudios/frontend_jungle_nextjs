"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { Button, Card, CardContent, Badge } from "@jungle/ui";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => adminApi.getUser(userId),
  });

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (!user) return <div className="p-6">User not found</div>;

  const actions = [
    { label: user.is_banned ? "Unban" : "Ban", fn: () => user.is_banned ? adminApi.unbanUser(userId) : adminApi.banUser(userId) },
    { label: user.is_verified ? "Unverify" : "Verify", fn: () => adminApi.verifyUser(userId) },
    { label: "Make Pro", fn: () => adminApi.makeUserPro(userId) },
    { label: "Make Admin", fn: () => adminApi.makeUserAdmin(userId) },
    { label: "Delete", fn: () => adminApi.deleteUser(userId), destructive: true },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User: {user.first_name} {user.last_name}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Username:</span> @{user.username}</div>
              <div><span className="text-muted-foreground">Email:</span> {user.email}</div>
              <div><span className="text-muted-foreground">Joined:</span> {new Date(user.created_at).toLocaleDateString()}</div>
              <div><span className="text-muted-foreground">Last seen:</span> {new Date(user.last_seen).toLocaleDateString()}</div>
              <div><span className="text-muted-foreground">Posts:</span> {user.post_count}</div>
              <div><span className="text-muted-foreground">Followers:</span> {user.follower_count}</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {user.is_verified && <Badge>Verified</Badge>}
              {user.is_pro > 0 && <Badge variant="secondary">Pro</Badge>}
              {user.is_banned && <Badge variant="destructive">Banned</Badge>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 space-y-2">
            <h2 className="font-semibold mb-3">Actions</h2>
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.destructive ? "destructive" : "outline"}
                size="sm"
                className="w-full"
                onClick={async () => {
                  try {
                    await action.fn();
                    toast.success(`${action.label} successful`);
                    refetch();
                  } catch {
                    toast.error("Action failed");
                  }
                }}
              >
                {action.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
