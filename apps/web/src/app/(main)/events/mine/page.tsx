"use client";

import { eventsApi } from "@jungle/api-client";
import { EventListSection } from "@/components/events/EventListSection";
import { Star } from "lucide-react";

export default function MyEventsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Star className="h-6 w-6" />
        <h1 className="text-2xl font-bold">My Events</h1>
      </div>
      <EventListSection
        fetcher={eventsApi.getMyEvents}
        emptyMessage="You haven't created any events yet."
      />
    </div>
  );
}
