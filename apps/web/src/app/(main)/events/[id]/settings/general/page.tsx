"use client";

import { use, useEffect, useState } from "react";
import { eventsApi } from "@jungle/api-client";
import type { Event } from "@jungle/api-client";
import { useMediaUpload } from "@jungle/hooks";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Skeleton,
} from "@jungle/ui";
import { toast } from "sonner";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EventGeneralSettings({ params }: Props) {
  const { id } = use(params);
  const eventId = Number(id);
  const { uploadImage, isUploading } = useMediaUpload();
  const [event, setEvent] = useState<Event | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    start_date: "",
    end_date: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!Number.isFinite(eventId)) {
      setLoading(false);
      return;
    }
    eventsApi
      .getEvent(eventId)
      .then((e) => {
        setEvent(e);
        setForm({
          title: e.title,
          description: e.description,
          location: e.location,
          start_date: e.start_date ? new Date(e.start_date).toISOString().slice(0, 16) : "",
          end_date: e.end_date ? new Date(e.end_date).toISOString().slice(0, 16) : "",
        });
      })
      .catch(() => toast.error("Failed to load event"))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSave = async () => {
    if (!event) return;
    setSaving(true);
    try {
      await eventsApi.updateEvent(event.id, {
        title: form.title,
        description: form.description,
        location: form.location,
        start_date: form.start_date,
        end_date: form.end_date || undefined,
      });
      toast.success("Event settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!event) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const media = await uploadImage(file, "cover");
    if (media) {
      const fd = new FormData();
      fd.append("cover", file);
      const res = await eventsApi.uploadEventCover(event.id, fd);
      setEvent((ev) => (ev ? { ...ev, cover: res.cover } : ev));
      toast.success("Cover updated");
    }
    e.target.value = "";
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!event)
    return (
      <p className="text-center mt-8 text-muted-foreground">
        Event not found or access denied.
      </p>
    );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Event title</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="Physical address or online link"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => update("start_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Date (optional)</Label>
              <Input
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => update("end_date", e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Cover</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="event-cover"
            onChange={handleCoverChange}
          />
          <label htmlFor="event-cover">
            <Button asChild variant="outline" disabled={isUploading}>
              <span>{isUploading ? "Uploading…" : "Change cover"}</span>
            </Button>
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
