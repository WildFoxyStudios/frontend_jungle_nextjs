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

export function TestSmsButton() {
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!to.trim()) return;
    setBusy(true);
    try {
      await adminApi.testSms({ to: to.trim() });
      toast.success(`Test SMS sent to ${to.trim()}`);
      setOpen(false);
      setTo("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send SMS");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Send a test SMS</p>
            <p className="text-xs text-muted-foreground">
              Verify that the configured SMS gateway is delivering messages.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Send className="h-4 w-4 mr-1" /> Test SMS
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send test SMS</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Recipient phone</Label>
              <Input
                type="tel"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="+1 555 555 5555"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={send} disabled={!to.trim() || busy}>
              {busy ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
