"use client";

import { useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Card, CardContent, Input, Label } from "@jungle/ui";
import { adminApi } from "@jungle/api-client";
import { toast } from "sonner";

export default function NewsletterPage() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) return;
    setIsSending(true);
    try {
      await adminApi.sendNewsletter({ subject, content });
      toast.success("Newsletter sent");
      setSubject(""); setContent("");
    } catch { toast.error("Failed to send"); }
    finally { setIsSending(false); }
  };

  return (
    <AdminPageShell title="Newsletter">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Newsletter subject" />
          </div>
          <div className="space-y-1.5">
            <Label>Content</Label>
            <textarea
              className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Newsletter content (HTML supported)"
            />
          </div>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? "Sending…" : "Send Newsletter"}
          </Button>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
