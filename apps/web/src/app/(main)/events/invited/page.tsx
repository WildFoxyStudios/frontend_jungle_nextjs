"use client";

import { eventsApi } from "@jungle/api-client";
import { EventListSection } from "@/components/events/EventListSection";
import { Mail } from "lucide-react";

export default function InvitedEventsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Event Invitations</h1>
      </div>
      <EventListSection
        fetcher={eventsApi.getInvitedEvents}
        emptyMessage="You have no pending event invitations."
      />
    </div>
  );
}
