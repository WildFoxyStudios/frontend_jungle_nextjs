"use client";
import { useState } from "react";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Card, CardContent, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@jungle/ui";
import { toast } from "sonner";

export default function MassNotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [segment, setSegment] = useState("all");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      await adminApi.sendMassNotification({ title, message, segment });
      toast.success("Mass notification sent");
      setTitle(""); setMessage("");
    } catch { toast.error("Failed to send"); }
    finally { setSending(false); }
  };

  return (
    <AdminPageShell title="Mass Notifications" description="Send a notification to all or a segment of users">
      <Card className="max-w-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" />
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <textarea
              className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Notification message…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Target Segment</Label>
            <Select value={segment} onValueChange={setSegment}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="pro">Pro Members Only</SelectItem>
                <SelectItem value="free">Free Users Only</SelectItem>
                <SelectItem value="verified">Verified Users Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSend} disabled={!title.trim() || !message.trim() || sending} className="w-full">
            {sending ? "Sending…" : "Send Notification"}
          </Button>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
