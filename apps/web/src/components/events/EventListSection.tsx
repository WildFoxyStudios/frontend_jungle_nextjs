"use client";

import { useEffect, useState } from "react";
import type { Event, PaginatedResponse } from "@jungle/api-client";
import { Card, CardContent, Button, Skeleton, Badge } from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";

interface Props {
  fetcher: (cursor?: string) => Promise<PaginatedResponse<Event>>;
  emptyMessage?: string;
}

export function EventListSection({ fetcher, emptyMessage = "No events found." }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadEvents = async (cur?: string) => {
    if (cur) setLoadingMore(true);
    try {
      const res = await fetcher(cur);
      if (cur) {
        setEvents((prev) => [...prev, ...(res.data as Event[])]);
      } else {
        setEvents(res.data as Event[]);
      }
      setCursor(res.meta.has_more ? res.meta.cursor : undefined);
      setHasMore(res.meta.has_more);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Link key={event.id} href={`/events/${event.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-start gap-4">
              {event.cover && (
                <img
                  src={event.cover}
                  alt={event.title}
                  className="h-20 w-28 rounded-md object-cover shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-semibold line-clamp-1">{event.title}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(event.start_date).toLocaleDateString()}
                  </span>
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {event.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {event.going_count} going
                  </span>
                </div>
                {event.my_rsvp && (
                  <Badge variant="secondary" className="text-xs capitalize">
                    {event.my_rsvp.replace("_", " ")}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}

      {hasMore && (
        <div className="text-center pt-2">
          <Button variant="outline" disabled={loadingMore} onClick={() => loadEvents(cursor)}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
