"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { Event, PaginatedResponse } from "@jungle/api-client";
import { Card, CardContent, Button, Skeleton, Badge } from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";
import { MapPin, Users } from "lucide-react";

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

 const loadEvents = useCallback(async (cur?: string) => {
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
 }, [fetcher]);

 useEffect(() => { void loadEvents(); }, [loadEvents]);

 if (loading) {
 return (
 <div className="space-y-3">
 {Array.from({ length: 4 }).map((_, i) => (
 <Skeleton key={i} className="h-28 w-full" />
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
 <div className="flex gap-4 p-3 rounded-lg border border-border-subtle hover:shadow-md transition-shadow cursor-pointer bg-card">
 <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary-subtle text-primary font-bold shrink-0 self-center">
 <span className="text-xs leading-none">{new Date(event.start_date).toLocaleDateString(undefined, { month: "short" })}</span>
 <span className="text-lg leading-none mt-0.5">{new Date(event.start_date).getDate()}</span>
 </div>
 {event.cover && (
 <Image
 src={event.cover}
 alt={event.title}
 width={80}
 height={80}
 unoptimized
 className="h-16 w-16 shrink-0 rounded-md object-cover self-center"
 />
 )}
 <div className="flex-1 min-w-0 space-y-1 self-center">
 <p className="font-semibold text-[15px] leading-snug line-clamp-1">{event.title}</p>
 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
 </div>
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
