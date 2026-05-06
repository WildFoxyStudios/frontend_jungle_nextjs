"use client";
import { useState } from "react";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jungle/ui";
import { toast } from "sonner";

export default function MassNotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [segment, setSegment] = useState("all");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("any");
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        title,
        message,
        segment,
        target: segment,
      };
      if (country.trim()) payload.country = country.trim();
      if (gender !== "any") payload.gender = gender;
      if (onlyOnline) payload.only_online = true;

      await adminApi.sendMassNotification(payload as Parameters<typeof adminApi.sendMassNotification>[0]);
      toast.success("Mass notification sent");
      setTitle("");
      setMessage("");
    } catch {
      toast.error("Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminPageShell
      title="Mass Notifications"
      description="Push a notification to all users or a refined segment."
    >
      <Card className="max-w-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" />
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <textarea
              className="w-full min-h-[120px] border bg-background px-3 py-2 text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Notification message…"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Segment</Label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="pro">Pro Members Only</SelectItem>
                  <SelectItem value="new">New (last 30 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Country (ISO code)</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="e.g. US, FR, ES"
                maxLength={2}
              />
            </div>

            <label className="flex items-center gap-2 self-end mb-2">
              <input
                type="checkbox"
                checked={onlyOnline}
                onChange={(e) => setOnlyOnline(e.target.checked)}
              />
              Only online users
            </label>
          </div>

          <Button
            onClick={handleSend}
            disabled={!title.trim() || !message.trim() || sending}
            className="w-full"
          >
            {sending ? "Sending…" : "Send Notification"}
          </Button>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
