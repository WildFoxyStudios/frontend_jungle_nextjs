"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { eventsApi } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@jungle/ui";
import { toast } from "sonner";

export default function CreateEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", start_date: "", end_date: "", location: "" });
  const [isLoading, setIsLoading] = useState(false);
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_date) return;
    setIsLoading(true);
    try {
      const ev = await eventsApi.createEvent(form);
      router.push("/events/" + ev.id);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create event"); }
    finally { setIsLoading(false); }
  };
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader><CardTitle>Create Event</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={(e) => update("title", e.target.value)} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Start *</Label><Input type="datetime-local" value={form.start_date} onChange={(e) => update("start_date", e.target.value)} /></div>
              <div className="space-y-1"><Label>End</Label><Input type="datetime-local" value={form.end_date} onChange={(e) => update("end_date", e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label>Location</Label><Input value={form.location} onChange={(e) => update("location", e.target.value)} /></div>
            <Button type="submit" disabled={isLoading || !form.title.trim() || !form.start_date} className="w-full">{isLoading ? "Creating..." : "Create event"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}