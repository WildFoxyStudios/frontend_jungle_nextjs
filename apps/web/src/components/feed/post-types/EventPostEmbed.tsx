import Link from "next/link";
import { Button } from "@jungle/ui";
import { Calendar, MapPin } from "lucide-react";

interface EventPostEmbedProps {
  eventInfo: { id: number; name: string; location: string; start_date: string; cover: string };
}

export function EventPostEmbed({ eventInfo }: EventPostEmbedProps) {
  const startDate = new Date(eventInfo.start_date);
  const month = startDate.toLocaleString('default', { month: 'short' });
  const day = startDate.getDate();

  return (
    <div className="border rounded-xl overflow-hidden bg-background">
      {eventInfo.cover && (
        <div className="relative aspect-[3/1] bg-muted">
          <img src={eventInfo.cover} alt={eventInfo.name} className="absolute inset-0 w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 flex gap-4">
        {/* Calendar visual */}
        <div className="bg-muted rounded-lg flex flex-col items-center justify-center w-14 h-14 shrink-0 overflow-hidden border">
          <div className="bg-primary w-full text-center text-[10px] text-white font-bold uppercase py-0.5">{month}</div>
          <div className="text-xl font-bold p-1">{day}</div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{eventInfo.name}</h3>
            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{eventInfo.location}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" asChild>
              <Link href={`/events/${eventInfo.id}`}>Going</Link>
            </Button>
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/events/${eventInfo.id}`}>Interested</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
