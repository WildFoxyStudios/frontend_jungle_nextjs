"use client";

import { useEffect, useState } from "react";
import { contentApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import {
  Card,
  CardContent,
  Skeleton,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
} from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";
import { Users, MessageSquare, FileText } from "lucide-react";

interface TopPoster {
  user: PublicUser;
  thread_count: number;
  reply_count: number;
}

export default function ForumMembersPage() {
  const [members, setMembers] = useState<TopPoster[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi.getForumTopPosters()
      .then((data) => setMembers(data as TopPoster[]))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load members"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Top Forum Members</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No forum members yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {members.map((entry, index) => (
            <Card key={entry.user.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <span className="text-lg font-bold text-muted-foreground w-7 text-center shrink-0">
                  #{index + 1}
                </span>
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={entry.user.avatar} />
                  <AvatarFallback>{entry.user.first_name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/${entry.user.username}`}
                    className="font-semibold hover:underline truncate block"
                  >
                    {entry.user.first_name} {entry.user.last_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">@{entry.user.username}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    <FileText className="h-3 w-3" />
                    {entry.thread_count} threads
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <MessageSquare className="h-3 w-3" />
                    {entry.reply_count} replies
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
