"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { eventsApi } from "@jungle/api-client";
import type { Event } from "@jungle/api-client";
import { Button, Card, CardContent, Skeleton } from "@jungle/ui";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi.getUpcoming().then((r) => setEvents(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button asChild><Link href="/events/create">Create event</Link></Button>
      </div>
      {loading ? <Skeleton className="h-48 w-full" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-4">
                <Link href={`/events/${e.id}`} className="font-semibold hover:underline">{e.title}</Link>
                <p className="text-xs text-muted-foreground mt-1">{new Date(e.start_date).toLocaleDateString()} · {e.location}</p>
                <p className="text-xs text-muted-foreground">{e.going_count} going · {e.interested_count} interested</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
