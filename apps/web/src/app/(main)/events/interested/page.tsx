"use client";

import { eventsApi } from "@jungle/api-client";
import { EventListSection } from "@/components/events/EventListSection";
import { Bookmark } from "lucide-react";

export default function InterestedEventsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Bookmark className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Events I&apos;m Interested In</h1>
      </div>
      <EventListSection
        fetcher={eventsApi.getInterestedEvents}
        emptyMessage="You haven't marked any events as interested."
      />
    </div>
  );
}
