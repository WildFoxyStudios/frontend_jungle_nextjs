"use client";

import { use, useEffect, useState } from "react";
import { eventsApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import { Avatar, AvatarImage, AvatarFallback, Skeleton, Button } from "@jungle/ui";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/lib/avatar";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

export default function EventAttendees({ params }: Props) {
  const { id } = use(params);
  const eventId = Number(id);
  const [attendees, setAttendees] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadAttendees();
  }, [eventId]);

  const loadAttendees = async (nextCursor?: string) => {
    try {
      const res = await eventsApi.getGoing(eventId, nextCursor);
      const data = Array.isArray(res?.data) ? res.data : [];
      if (nextCursor) {
        setAttendees((prev) => [...prev, ...data]);
      } else {
        setAttendees(data);
      }
      setHasMore(res?.meta?.has_more ?? false);
      setCursor(res?.meta?.cursor);
    } catch {
      toast.error("Failed to load attendees");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    loadAttendees(cursor);
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Going ({attendees.length})</h2>
      {attendees.length === 0 ? (
        <p className="text-muted-foreground">No one is going yet.</p>
      ) : (
        <>
          <div className="space-y-2">
            {attendees.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <Link href={`/profile/${user.username}`} className="flex items-center gap-3 hover:opacity-80">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={resolveAvatarUrl(user.avatar)} />
                    <AvatarFallback>{user.first_name?.[0]}{user.last_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          {hasMore && (
            <Button variant="outline" onClick={loadMore} disabled={loadingMore} className="w-full">
              {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
