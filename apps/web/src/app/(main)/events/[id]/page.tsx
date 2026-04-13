import type { Metadata } from "next";
import { eventsApi } from "@jungle/api-client";
import { buildEventMetadata, eventJsonLd, BASE_URL } from "@/lib/seo";
import { EventClient } from "./EventClient";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const event = await eventsApi.getEvent(Number(id));
    return buildEventMetadata(event);
  } catch {
    return { title: "Event | Jungle" };
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;

  let jsonLd = null;
  try {
    const event = await eventsApi.getEvent(Number(id));
    jsonLd = eventJsonLd({ ...event, url: `${BASE_URL}/events/${id}` });
  } catch {}

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <EventClient id={id} />
    </>
  );
}
