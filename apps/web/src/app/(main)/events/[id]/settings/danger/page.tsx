"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { eventsApi } from "@jungle/api-client";
import type { Event } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

export default function EventDangerZone({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const eventId = Number(id);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    eventsApi.getEvent(eventId)
      .then((e) => setEvent(e))
      .catch(() => toast.error("Failed to load event"))
      .finally(() => setLoading(false));
  }, [eventId]);

  const confirmDelete = async () => {
    if (!event) return;
    setDeleting(true);
    try {
      await eventsApi.deleteEvent(event.id);
      toast.success("Event deleted");
      router.push("/events");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete event");
      setDeleting(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!event) return <p className="text-muted-foreground">Event not found.</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
      
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle size={20} /> Delete Event
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Once you delete <strong>{event.title}</strong>, there is no going back. All data will be permanently removed.
          </p>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete Event"}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this event?"
        description={`"${event.title}" and all of its data will be permanently removed. This cannot be undone.`}
        variant="destructive"
        confirmText="Delete event"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
