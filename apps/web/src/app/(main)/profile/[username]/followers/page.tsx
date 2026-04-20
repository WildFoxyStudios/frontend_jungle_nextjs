"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { usersApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import { Avatar, AvatarFallback, AvatarImage, Skeleton } from "@jungle/ui";
import { toast } from "sonner";

interface Props { params: Promise<{ username: string }> }

export default function FollowersPage({ params }: Props) {
  const { username } = use(params);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.getFollowers(username)
      .then((r) => setUsers(r.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load followers"))
      .finally(() => setLoading(false));
  }, [username]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold mb-4">Followers</h1>
      {loading ? <Skeleton className="h-48 w-full" /> : (
        <div className="divide-y">
          {users.map((u) => (
            <Link key={u.id} href={`/profile/${u.username}`} className="flex items-center gap-3 py-3 hover:bg-muted/50 px-2 rounded-lg">
              <Avatar className="h-10 w-10"><AvatarImage src={u.avatar} /><AvatarFallback>{u.first_name[0]}</AvatarFallback></Avatar>
              <div>
                <p className="font-semibold text-sm">{u.first_name} {u.last_name}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
