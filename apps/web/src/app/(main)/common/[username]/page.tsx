"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { usersApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import {
  Skeleton, Card, CardContent, CardHeader, CardTitle, Avatar, AvatarFallback, AvatarImage, Badge,
} from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";
import { Users, FileText, UsersRound } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";

interface CommonData {
  friends: PublicUser[];
  groups: { id: number; name: string; avatar?: string; member_count?: number }[];
  pages: { id: number; name: string; avatar?: string; like_count?: number }[];
}

interface Props { params: Promise<{ username: string }> }

export default function CommonPage({ params }: Props) {
  const { username } = use(params);
  const [common, setCommon] = useState<CommonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.getCommonThings(username)
      .then((data) => setCommon(data as CommonData))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load common data"))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  const friends = common?.friends ?? [];
  const groups = common?.groups ?? [];
  const pages = common?.pages ?? [];
  const totalCommon = friends.length + groups.length + pages.length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
      <h1 className="text-2xl font-bold">Things in common with @{username}</h1>

      {totalCommon === 0 && (
        <EmptyState icon={Users} title="Nothing in common" description={`You and @${username} don't share any friends, groups, or pages yet.`} />
      )}

      {/* Mutual friends */}
      {friends.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> Mutual Friends <Badge variant="secondary">{friends.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {friends.map((f) => (
              <Link
                key={f.id}
                href={`/profile/${f.username}`}
                className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded hover:bg-muted/50"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={resolveAvatarUrl(f.avatar)} />
                  <AvatarFallback>{f.first_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{f.first_name} {f.last_name}</p>
                  <p className="text-xs text-muted-foreground">@{f.username}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Mutual groups */}
      {groups.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UsersRound className="h-4 w-4" /> Mutual Groups <Badge variant="secondary">{groups.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded hover:bg-muted/50"
              >
                <Avatar className="h-9 w-9 rounded">
                  <AvatarImage src={resolveAvatarUrl(g.avatar)} />
                  <AvatarFallback className="rounded">{g.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{g.name}</p>
                  {g.member_count !== undefined && (
                    <p className="text-xs text-muted-foreground">{g.member_count} members</p>
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Mutual pages */}
      {pages.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" /> Mutual Pages <Badge variant="secondary">{pages.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pages.map((p) => (
              <Link
                key={p.id}
                href={`/pages/${p.id}`}
                className="flex items-center gap-3 py-1.5 px-2 -mx-2 rounded hover:bg-muted/50"
              >
                <Avatar className="h-9 w-9 rounded">
                  <AvatarImage src={resolveAvatarUrl(p.avatar)} />
                  <AvatarFallback className="rounded">{p.name[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  {p.like_count !== undefined && (
                    <p className="text-xs text-muted-foreground">{p.like_count} likes</p>
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
