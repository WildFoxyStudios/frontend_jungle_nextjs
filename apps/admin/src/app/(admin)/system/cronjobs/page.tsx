"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@jungle/ui";
import { RefreshCw } from "lucide-react";

interface JobInfo {
  name: string;
  description: string;
  schedule: string;
  last_run: string | null;
  status: "healthy" | "warning" | "error" | "idle";
}

// Static catalog — lives in the admin UI because jobs-runner schedules them
// programmatically (no DB row per job). Matches the spawn list in
// `backend/crates/jobs-runner/src/main.rs`.
const JOBS: JobInfo[] = [
  { name: "story_cleanup",                schedule: "every 1h",         description: "Delete stories past their 24h window",         last_run: null, status: "idle" },
  { name: "session_cleanup",              schedule: "every 6h",         description: "Purge expired user_sessions",                   last_run: null, status: "idle" },
  { name: "notification_cleanup",         schedule: "every 24h",        description: "Delete notifications older than 60 days",       last_run: null, status: "idle" },
  { name: "pro_subscription_check",       schedule: "every 1h",         description: "Expire Pro memberships past their end date",    last_run: null, status: "idle" },
  { name: "event_reminders",              schedule: "every 1h",         description: "Notify users about upcoming events",            last_run: null, status: "idle" },
  { name: "ad_budget_check",              schedule: "every 5m",         description: "Stop ads that exhausted their budget",          last_run: null, status: "idle" },
  { name: "hashtag_trending",             schedule: "every 10m",        description: "Rebuild trending-hashtag cache",                last_run: null, status: "idle" },
  { name: "login_attempts_cleanup",       schedule: "every 1h",         description: "Purge old login_attempts rows",                 last_run: null, status: "idle" },
  { name: "memories_notification",        schedule: "every 24h",        description: "Notify users with 1-year anniversary posts",    last_run: null, status: "idle" },
  { name: "birthday_notifications",       schedule: "every 24h",        description: "Notify followers about birthdays",              last_run: null, status: "idle" },
  { name: "live_stream_cleanup",          schedule: "every 10m",        description: "End abandoned live streams",                    last_run: null, status: "idle" },
  { name: "publish_scheduled_posts",      schedule: "every 1m",         description: "Publish posts whose scheduled_at has passed",   last_run: null, status: "idle" },
  { name: "auto_delete_old_messages",     schedule: "every 6h",         description: "Delete messages older than retention window",   last_run: null, status: "idle" },
  { name: "weekly_memories_digest",       schedule: "Mondays 09:00 UTC", description: "Weekly memories email",                         last_run: null, status: "idle" },
  { name: "expire_pending_ads",           schedule: "every 1h",         description: "Mark ads as expired when budget/date done",     last_run: null, status: "idle" },
  { name: "analytics_snapshot_daily",     schedule: "daily 00:10 UTC",  description: "Aggregate yesterday's metrics",                 last_run: null, status: "idle" },
  { name: "crypto_payment_reconciliation",schedule: "every 15m",        description: "Reconcile crypto transactions via provider API", last_run: null, status: "idle" },
  { name: "newsletter_dispatcher",        schedule: "every 5m",         description: "Send pending newsletter emails in batches",     last_run: null, status: "idle" },
  { name: "dlq_consumer",                 schedule: "continuous",       description: "Persist NATS dead-letter events",               last_run: null, status: "idle" },
];

export default function CronjobsPage() {
  const { data: liveStatus, refetch } = useQuery({
    queryKey: ["admin", "cronjobs", "status"],
    // This endpoint is optional — if the backend doesn't expose it yet, we fall
    // back to the static catalog above.
    queryFn: async () => {
      try {
        return await api.get<Record<string, { last_run?: string; status?: string }>>(
          "/v1/admin/cronjobs/status",
        );
      } catch {
        return {} as Record<string, never>;
      }
    },
    refetchInterval: 30_000,
  });

  return (
    <AdminPageShell
      title="Scheduled jobs"
      description="Background tasks executed by the jobs-runner service."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      }
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Last run</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {JOBS.map((job) => {
                const live = (liveStatus as Record<string, { last_run?: string; status?: string }> | undefined)?.[job.name];
                const lastRun = live?.last_run ?? job.last_run;
                const status = (live?.status as JobInfo["status"]) ?? job.status;
                return (
                  <TableRow key={job.name}>
                    <TableCell className="font-mono text-xs">{job.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{job.schedule}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{job.description}</TableCell>
                    <TableCell className="text-xs">
                      {lastRun ? new Date(lastRun).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(status)}>{status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}

function statusVariant(status: JobInfo["status"]): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "healthy":
      return "default";
    case "warning":
      return "secondary";
    case "error":
      return "destructive";
    default:
      return "outline";
  }
}
