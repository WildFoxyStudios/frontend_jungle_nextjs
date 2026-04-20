"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@jungle/ui";
import { Mail, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Audience = "all" | "pro" | "verified" | "recent" | "specific";

interface CampaignRequest {
  subject: string;
  body: string;
  audience: Audience;
  usernames?: string[];
  registered_after?: string;
}

export default function SendEmailPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [usernames, setUsernames] = useState("");
  const [registeredAfter, setRegisteredAfter] = useState("");

  const mutation = useMutation({
    mutationFn: (req: CampaignRequest) => api.post<{ queued: number }>("/v1/admin/email-campaigns", req),
    onSuccess: (res) => {
      toast.success(`Queued ${res.queued} emails`);
      setSubject("");
      setBody("");
      setUsernames("");
    },
    onError: (e) => toast.error(`Failed: ${e instanceof Error ? e.message : "unknown"}`),
  });

  const handleSend = () => {
    if (!subject.trim()) return toast.error("Subject required");
    if (!body.trim()) return toast.error("Body required");

    const payload: CampaignRequest = {
      subject: subject.trim(),
      body: body.trim(),
      audience,
    };

    if (audience === "specific") {
      const list = usernames
        .split(/[\n,]/)
        .map((u) => u.trim().replace(/^@/, ""))
        .filter(Boolean);
      if (list.length === 0) return toast.error("At least one username required");
      payload.usernames = list;
    } else if (audience === "recent" && registeredAfter) {
      payload.registered_after = registeredAfter;
    }

    mutation.mutate(payload);
  };

  const estimatedCount = (() => {
    if (audience === "specific") {
      return usernames.split(/[\n,]/).filter((s) => s.trim()).length;
    }
    return undefined;
  })();

  return (
    <AdminPageShell
      title="Send bulk email"
      description="Compose and enqueue an email campaign. Emails are sent asynchronously by newsletter_dispatcher."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's new on Jungle this week"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">Body (HTML allowed)</Label>
              <Textarea
                id="body"
                rows={14}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="<h1>Hi {{first_name}}!</h1>&#10;<p>…</p>"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                You can use <code>{"{{first_name}}"}</code>, <code>{"{{username}}"}</code>, <code>{"{{email}}"}</code> as placeholders.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All active users</SelectItem>
                  <SelectItem value="pro">Pro members</SelectItem>
                  <SelectItem value="verified">Verified users</SelectItem>
                  <SelectItem value="recent">Registered after date</SelectItem>
                  <SelectItem value="specific">Specific usernames</SelectItem>
                </SelectContent>
              </Select>

              {audience === "recent" && (
                <div className="space-y-1.5">
                  <Label htmlFor="date">Registered after</Label>
                  <Input
                    id="date"
                    type="date"
                    value={registeredAfter}
                    onChange={(e) => setRegisteredAfter(e.target.value)}
                  />
                </div>
              )}

              {audience === "specific" && (
                <div className="space-y-1.5">
                  <Label htmlFor="usernames">Usernames (one per line or comma-separated)</Label>
                  <Textarea
                    id="usernames"
                    rows={6}
                    value={usernames}
                    onChange={(e) => setUsernames(e.target.value)}
                    placeholder="alice&#10;bob&#10;@charlie"
                    className="font-mono text-xs"
                  />
                  {estimatedCount !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      {estimatedCount} username{estimatedCount === 1 ? "" : "s"}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleSend}
            disabled={mutation.isPending}
            className="w-full"
            size="lg"
          >
            {mutation.isPending ? (
              <>
                <Mail className="mr-2 h-4 w-4 animate-pulse" /> Queuing…
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Queue emails
              </>
            )}
          </Button>
        </div>
      </div>
    </AdminPageShell>
  );
}
