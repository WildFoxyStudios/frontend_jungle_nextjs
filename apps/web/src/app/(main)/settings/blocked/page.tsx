"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Button, Avatar, AvatarFallback, AvatarImage, Skeleton } from "@jungle/ui";
import { toast } from "sonner";

export default function BlockedPage() {
  const [blocked, setBlocked] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.getBlockedUsers()
      .then((r) => setBlocked(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUnblock = async (userId: number) => {
    try {
      await usersApi.unblock(userId);
      setBlocked((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User unblocked");
    } catch {
      toast.error("Failed to unblock user");
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <Card>
      <CardHeader><CardTitle>Blocked Users</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {blocked.length === 0 && (
          <p className="text-muted-foreground text-sm">You haven't blocked anyone.</p>
        )}
        {blocked.map((user) => (
          <div key={user.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.first_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleUnblock(user.id)}>
              Unblock
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
