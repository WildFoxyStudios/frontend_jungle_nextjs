"use client";

import { useSearchParams } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@jungle/ui";

export default function OAuthAuthorizePage() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const scope = searchParams.get("scope");
  const state = searchParams.get("state");

  const handleApprove = async () => {
    const res = await fetch("/api/oauth/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, redirect_uri: redirectUri, scope, state, approved: true }),
    });
    const data = await res.json();
    if (data.redirect_url) window.location.href = data.redirect_url;
  };

  const handleDeny = () => {
    if (redirectUri) {
      window.location.href = `${redirectUri}?error=access_denied&state=${state}`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Authorize Application</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">An application (<code className="bg-muted px-1 rounded">{clientId}</code>) is requesting access to your account.</p>
          {scope && (
            <div>
              <p className="text-sm font-medium mb-1">Requested permissions:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                {scope.split(" ").map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          )}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleApprove}>Authorize</Button>
            <Button variant="outline" className="flex-1" onClick={handleDeny}>Deny</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
