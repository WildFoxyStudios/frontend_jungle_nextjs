"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@jungle/ui";
import { RefreshCw, Square } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface LiveStream {
  id: number;
  user_id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  title: string | null;
  viewer_count: number;
  started_at: string;
  duration_seconds: number | null;
}

export default function AdminLiveStreamsPage() {
  const qc = useQueryClient();
  const [pendingEnd, setPendingEnd] = useState<LiveStream | null>(null);

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["admin", "live-streams"],
    queryFn: () => api.get<LiveStream[]>("/v1/admin/live-streams"),
    refetchInterval: 15_000,
  });

  const forceEnd = useMutation({
    mutationFn: (id: number) => api.delete<{ ended: true }>(`/v1/admin/live-streams/${id}`),
    onSuccess: () => {
      toast.success("Stream ended");
      qc.invalidateQueries({ queryKey: ["admin", "live-streams"] });
    },
    onError: (e) => toast.error(`Failed: ${e instanceof Error ? e.message : "unknown"}`),
  });

  const streams = data ?? [];
  const total = streams.length;
  const totalViewers = streams.reduce((acc, s) => acc + (s.viewer_count ?? 0), 0);

  return (
    <AdminPageShell
      title="Live streams"
      description="Active live broadcasts. Updates every 15 seconds."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard label="Active streams" value={total} />
        <StatCard label="Total viewers" value={totalViewers} />
        <StatCard
          label="Avg viewers / stream"
          value={total > 0 ? Math.round(totalViewers / total) : 0}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Host</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Viewers</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="text-right w-36">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {streams.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No active live streams.
                  </TableCell>
                </TableRow>
              )}
              {streams.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={s.avatar ?? ""} />
                        <AvatarFallback>{s.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {s.first_name} {s.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">@{s.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{s.title ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono">{s.viewer_count}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {formatDuration(s.duration_seconds ?? secondsSince(s.started_at))}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(s.started_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setPendingEnd(s)}
                      disabled={forceEnd.isPending}
                    >
                      <Square className="h-3.5 w-3.5 mr-1.5" /> End
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={pendingEnd !== null}
        onOpenChange={(o) => { if (!o) setPendingEnd(null); }}
        title="Force-end this live stream?"
        description={pendingEnd ? `Stream by @${pendingEnd.username}${pendingEnd.title ? ` — "${pendingEnd.title}"` : ""} will be ended immediately and viewers will be disconnected.` : undefined}
        variant="destructive"
        confirmText="End stream"
        onConfirm={async () => {
          if (pendingEnd) await forceEnd.mutateAsync(pendingEnd.id);
        }}
      />
    </AdminPageShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="text-3xl font-bold mt-1">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}

function secondsSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
