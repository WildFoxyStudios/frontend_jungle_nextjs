"use client";

import { useState } from "react";
import { adminApi } from "@jungle/api-client";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
} from "@jungle/ui";
import { toast } from "sonner";
import { Send } from "lucide-react";

/**
 * Test button rendered at the bottom of email/SMTP settings pages.
 * Sends a one-shot probe through the configured provider so admins can
 * verify their setup without having to register a fake user.
 */
export function TestEmailButton() {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!to.trim()) return;
    setBusy(true);
    try {
      await adminApi.testEmail({ to: to.trim() });
      toast.success(`Test email sent to ${to.trim()}`);
      setOpen(false);
      setTo("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Send a test email</p>
            <p className="text-xs text-muted-foreground">
              Verify that the configured SMTP / transactional provider can deliver mail.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Send className="h-4 w-4 mr-1" /> Test email
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send test email</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Recipient</Label>
              <Input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="admin@example.com"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={send} disabled={!to.includes("@") || busy}>
              {busy ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
