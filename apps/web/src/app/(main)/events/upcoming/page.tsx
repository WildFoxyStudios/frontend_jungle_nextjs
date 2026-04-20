"use client";

import { eventsApi } from "@jungle/api-client";
import { EventListSection } from "@/components/events/EventListSection";
import { CalendarDays } from "lucide-react";

export default function UpcomingEventsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Upcoming Events</h1>
      </div>
      <EventListSection
        fetcher={eventsApi.getUpcoming}
        emptyMessage="No upcoming events."
      />
    </div>
  );
}
