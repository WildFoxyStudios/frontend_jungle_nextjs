"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { eventsApi } from "@jungle/api-client";
import type { Event } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@jungle/ui";
import { toast } from "sonner";
import { PlacesAutocomplete } from "@/components/shared/PlacesAutocomplete";

function datetimeLocalToIso(s: string): string {
 const d = new Date(s);
 if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
 return d.toISOString();
}

export default function CreateEventPage() {
 const router = useRouter();
 const [form, setForm] = useState({ title: "", description: "", start_date: "", end_date: "", location: "" });
 const [placeCoords, setPlaceCoords] = useState<{ lat?: number; lng?: number }>({});
 const [isLoading, setIsLoading] = useState(false);
 const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

 const onSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!form.title.trim() || !form.start_date) return;
 setIsLoading(true);
 try {
 const startIso = datetimeLocalToIso(form.start_date);
 const endIso = form.end_date.trim()
 ? datetimeLocalToIso(form.end_date)
 : new Date(new Date(form.start_date).getTime() + 60 * 60 * 1000).toISOString();

 const payload: Partial<Event> & { title: string } = {
 title: form.title.trim(),
 start_date: startIso,
 end_date: endIso,
 };
 if (form.description.trim()) payload.description = form.description.trim();
 if (form.location.trim()) payload.location = form.location.trim();
 const { lat, lng } = placeCoords;
 if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
 payload.latitude = lat;
 payload.longitude = lng;
 }

 const ev = await eventsApi.createEvent(payload);
 router.push("/events/" + ev.id);
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to create event");
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="mx-auto max-w-2xl px-4 py-6">
 <Card>
 <CardHeader>
 <CardTitle>Create Event</CardTitle>
 </CardHeader>
 <CardContent>
 <form onSubmit={onSubmit} className="space-y-4">
 <div className="space-y-1">
 <Label>Title *</Label>
 <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
 </div>
 <div className="space-y-1">
 <Label>Description</Label>
 <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1">
 <Label>Start *</Label>
 <Input type="datetime-local" value={form.start_date} onChange={(e) => update("start_date", e.target.value)} />
 </div>
 <div className="space-y-1">
 <Label>End</Label>
 <Input type="datetime-local" value={form.end_date} onChange={(e) => update("end_date", e.target.value)} />
 </div>
 </div>
 <div className="space-y-1">
 <Label>Location</Label>
 <PlacesAutocomplete
 value={form.location}
 onChange={(v, meta) => {
 update("location", v);
 if (meta?.lat != null && meta?.lng != null && Number.isFinite(meta.lat) && Number.isFinite(meta.lng)) {
 setPlaceCoords({ lat: meta.lat, lng: meta.lng });
 }
 }}
 />
 </div>
 <Button type="submit" disabled={isLoading || !form.title.trim() || !form.start_date} className="w-full">
 {isLoading ? "Creating..." : "Create event"}
 </Button>
 </form>
 </CardContent>
 </Card>
 </div>
 );
}
