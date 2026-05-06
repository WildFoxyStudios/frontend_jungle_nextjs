import Image from "next/image";
import Link from "next/link";
import { Button } from "@jungle/ui";
import { MapPin } from "lucide-react";

interface EventPostEmbedProps {
 eventInfo: { id: number; name: string; location: string; start_date: string; cover: string };
}

export function EventPostEmbed({ eventInfo }: EventPostEmbedProps) {
 const startDate = new Date(eventInfo.start_date);
 const month = startDate.toLocaleString("default", { month: "short" });
 const day = startDate.getDate();

 return (
 <div className="overflow-hidden border rounded-lg bg-card">
 {eventInfo.cover && (
 <div className="relative aspect-[3/1] bg-muted">
 <Image src={eventInfo.cover} alt={eventInfo.name} fill unoptimized className="object-cover" />
 </div>
 )}
 <div className="flex gap-4 p-4">
 <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center overflow-hidden border rounded-md bg-muted">
 <div className="w-full bg-primary py-0.5 text-center text-[10px] font-bold text-white">{month}</div>
 <div className="text-xl font-bold p-1">{day}</div>
 </div>

 <div className="flex-1 space-y-3">
 <div>
 <h3 className="line-clamp-1 text-lg font-semibold">{eventInfo.name}</h3>
 <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
 <MapPin className="h-3 w-3 shrink-0" />
 <span className="truncate">{eventInfo.location}</span>
 </div>
 </div>

 <div className="border rounded-md bg-secondary/40 p-3 text-sm text-muted-foreground">
 Open the event page to view attendance options and full event details.
 </div>

 <div className="flex gap-2">
 <Button size="sm" asChild className="font-semibold">
 <Link href={`/events/${eventInfo.id}`}>View Event</Link>
 </Button>
 <Button size="sm" variant="secondary" asChild className="font-semibold">
 <Link href={`/events/${eventInfo.id}`}>Details</Link>
 </Button>
 </div>
 </div>
 </div>
 </div>
 );
}
