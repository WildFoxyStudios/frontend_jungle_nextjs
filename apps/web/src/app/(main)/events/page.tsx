"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { eventsApi } from "@jungle/api-client";
import type { Event } from "@jungle/api-client";
import { Button, Card, CardContent, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from "@jungle/ui";
import { toast } from "sonner";
import { CalendarPlus, CalendarDays, CalendarCheck, User } from "lucide-react";
import { useTranslations } from "next-intl";

type EventTab = "upcoming" | "attending" | "mine";

export default function EventsPage() {
  const [tab, setTab] = useState<EventTab>("upcoming");
  const t = useTranslations("events");

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild className="gap-1.5">
          <Link href="/events/create">
            <CalendarPlus className="h-4 w-4" />
            {t("createEvent")}
          </Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as EventTab)}>
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="upcoming" className="gap-1.5">
            <CalendarDays className="h-4 w-4" /> Upcoming
          </TabsTrigger>
          <TabsTrigger value="attending" className="gap-1.5">
            <CalendarCheck className="h-4 w-4" /> Attending
          </TabsTrigger>
          <TabsTrigger value="mine" className="gap-1.5">
            <User className="h-4 w-4" /> My events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <EventList
            fetcher={(cursor) => eventsApi.getUpcoming(cursor)}
            emptyMessage="No upcoming events right now."
          />
        </TabsContent>
        <TabsContent value="attending" className="mt-4">
          <EventList
            fetcher={(cursor) => eventsApi.getAttending(cursor)}
            emptyMessage="You haven't RSVP'd to any events yet."
          />
        </TabsContent>
        <TabsContent value="mine" className="mt-4">
          <EventList
            fetcher={(cursor) => eventsApi.getMyEvents(cursor)}
            emptyMessage="You haven't created any events yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface EventListProps {
  fetcher: (cursor?: string) => Promise<{ data: Event[]; meta?: { cursor?: string | null; has_more?: boolean } }>;
  emptyMessage: string;
}

function EventList({ fetcher, emptyMessage }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const t = useTranslations("events");

  const load = useCallback(
    async (reset: boolean) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      try {
        const nextCursor = reset ? undefined : cursor ?? undefined;
        const res = await fetcher(nextCursor);
        const list = Array.isArray(res?.data) ? res.data : [];
        setEvents((prev) => (reset ? list : [...prev, ...list]));
        setCursor(res?.meta?.cursor ?? null);
        setHasMore(Boolean(res?.meta?.has_more));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [fetcher, cursor],
  );

  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return <p className="text-center py-12 text-muted-foreground italic">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((e) => (
          <Card key={e.id}>
            <CardContent className="p-4">
              <Link href={`/events/${e.id}`} className="font-semibold hover:underline">
                {e.title}
              </Link>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(e.start_date).toLocaleDateString()} · {e.location}
              </p>
              <p className="text-xs text-muted-foreground">
                {e.going_count} {t("going")} · {e.interested_count} {t("interested")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => load(false)} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
