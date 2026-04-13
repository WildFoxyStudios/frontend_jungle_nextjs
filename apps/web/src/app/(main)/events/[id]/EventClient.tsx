"use client";

import { useEffect, useState } from "react";
import { eventsApi } from "@jungle/api-client";
import type { Event } from "@jungle/api-client";
import { Button, Skeleton } from "@jungle/ui";
import { MapPin } from "lucide-react";

interface Props { id: string }

export function EventClient({ id }: Props) {
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    eventsApi.getEvent(Number(id)).then(setEvent).catch(() => {});
  }, [id]);

  if (!event) return <Skeleton className="h-64 w-full max-w-2xl mx-auto mt-4" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">{event.title}</h1>
      <p className="text-sm text-muted-foreground">{new Date(event.start_date).toLocaleDateString()} — {new Date(event.end_date).toLocaleDateString()}</p>
      <p className="text-sm text-muted-foreground inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.location}</p>
      {event.description && <p className="text-sm">{event.description}</p>}
      <div className="flex gap-2">
        <Button onClick={() => eventsApi.respondEvent(event.id, "going")}>Going ({event.going_count})</Button>
        <Button variant="outline" onClick={() => eventsApi.respondEvent(event.id, "interested")}>Interested ({event.interested_count})</Button>
        <Button variant="ghost" onClick={() => eventsApi.respondEvent(event.id, "not_going")}>Not going</Button>
      </div>
    </div>
  );
}
