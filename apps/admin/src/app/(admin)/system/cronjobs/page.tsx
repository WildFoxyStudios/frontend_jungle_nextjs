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
  last_run: string | null;
  status: "healthy" | "warning" | "error" | "idle";
}


export default function CronjobsPage() {
  const { data: liveStatus, refetch } = useQuery({
    queryKey: ["admin", "cronjobs", "status"],
    queryFn: async () => {
      try {
        return await api.get<Record<string, { last_run?: string; status?: string }>>(
          "/v1/admin/cronjobs/status",
        );
      } catch {
        return {};
      }
    },
    refetchInterval: 30_000,
  });

  const jobs = (liveStatus ?? {}) as Record<string, JobInfo>;
  const jobEntries = Object.entries(jobs);

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
      {jobEntries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>No cron job data available</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Last run</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobEntries.map(([name, info]) => (
                  <TableRow key={name}>
                    <TableCell className="font-mono text-xs">{name}</TableCell>
                    <TableCell className="text-xs">
                      {info.last_run ? new Date(info.last_run).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(info.status)}>{info.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
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
