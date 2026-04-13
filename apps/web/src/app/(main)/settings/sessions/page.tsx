"use client";

import { useEffect, useState } from "react";
import { authApi } from "@jungle/api-client";
import type { UserSession } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { Monitor, Smartphone, Trash2 } from "lucide-react";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRevoke = async (id: string) => {
    try {
      await authApi.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Session revoked");
    } catch {
      toast.error("Failed to revoke session");
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <Card>
      <CardHeader><CardTitle>Active Sessions</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {sessions.length === 0 && (
          <p className="text-muted-foreground text-sm">No active sessions found.</p>
        )}
        {sessions.map((session) => (
          <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {session.device?.toLowerCase().includes("mobile") ? (
                <Smartphone className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Monitor className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{session.device ?? "Unknown device"}</p>
                  {session.is_current && <Badge variant="default" className="text-xs">Current</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {session.ip} · {session.location ?? "Unknown location"} · Last seen {new Date(session.last_seen).toLocaleDateString()}
                </p>
              </div>
            </div>
            {!session.is_current && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive h-8 w-8"
                onClick={() => handleRevoke(session.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
