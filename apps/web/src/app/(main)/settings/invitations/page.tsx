"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Skeleton, Badge } from "@jungle/ui";
import { toast } from "sonner";
import { Copy, Plus } from "lucide-react";

interface InviteCode { code: string; url: string }

export default function InvitationsPage() {
  const [inviteData, setInviteData] = useState<InviteCode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.getInviteCode()
      .then(setInviteData)
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Invite Friends</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Invite friends to join Jungle using your personal invitation link.
          </p>

          {inviteData && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Your Invitation Link</p>
                <div className="flex gap-2">
                  <Input value={inviteData.url} readOnly className="text-sm" />
                  <Button variant="outline" size="icon" onClick={() => handleCopy(inviteData.url)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Invitation Code</p>
                <div className="flex gap-2">
                  <Input value={inviteData.code} readOnly className="font-mono text-sm" />
                  <Button variant="outline" size="icon" onClick={() => handleCopy(inviteData.code)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: "Join me on Jungle!", url: inviteData.url });
                  } else {
                    handleCopy(inviteData.url);
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Invite a Friend
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
