"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { Copy, Share2 } from "lucide-react";

export default function ReferralsPage() {
  const [inviteData, setInviteData] = useState<{ code: string; url: string } | null>(null);
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

  const handleShare = async () => {
    if (!inviteData) return;
    if (navigator.share) {
      await navigator.share({ title: "Join me on Jungle", url: inviteData.url });
    } else {
      handleCopy(inviteData.url);
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Your Referral Link</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share your referral link and earn rewards when friends join and become active members.
          </p>

          {inviteData && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Referral Code</p>
                <div className="flex gap-2">
                  <Input value={inviteData.code} readOnly className="font-mono" />
                  <Button variant="outline" size="icon" onClick={() => handleCopy(inviteData.code)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Referral URL</p>
                <div className="flex gap-2">
                  <Input value={inviteData.url} readOnly className="text-xs" />
                  <Button variant="outline" size="icon" onClick={() => handleCopy(inviteData.url)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={handleShare} className="w-full">
                <Share2 className="h-4 w-4 mr-2" /> Share Referral Link
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
