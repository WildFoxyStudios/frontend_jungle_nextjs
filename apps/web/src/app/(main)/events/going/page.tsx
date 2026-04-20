"use client";

import { eventsApi } from "@jungle/api-client";
import { EventListSection } from "@/components/events/EventListSection";
import { CheckCircle } from "lucide-react";

export default function GoingEventsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <CheckCircle className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Events I&apos;m Going To</h1>
      </div>
      <EventListSection
        fetcher={eventsApi.getGoingEvents}
        emptyMessage="You haven't marked any events as going."
      />
    </div>
  );
}
