"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Button,
  Badge,
  Card,
  CardContent,
  ConfirmDialog,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@jungle/ui";
import { toast } from "sonner";
import { RefreshCcw, RotateCw, Trash2 } from "lucide-react";

interface DlqEntry {
  id: number;
  subject: string;
  payload: unknown;
  error?: string | null;
  attempt: number;
  retry_at?: string | null;
  consumed_at?: string | null;
  consumed_by?: number | null;
  created_at: string;
}

export default function DlqPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [inspect, setInspect] = useState<DlqEntry | null>(null);
  const [pendingDiscard, setPendingDiscard] = useState<DlqEntry | null>(null);
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dlq", page],
    queryFn: () => adminApi.getDlq({ limit, offset: page * limit }),
  });

  const entries = (data?.data ?? []) as DlqEntry[];
  const total = data?.meta?.total ?? 0;

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "dlq"] });

  const retryMutation = useMutation({
    mutationFn: (id: number) => adminApi.retryDlq(id),
    onSuccess: () => {
      toast.success("Event re-published");
      invalidate();
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Retry failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteDlq(id),
    onSuccess: () => {
      toast.success("DLQ entry discarded");
      invalidate();
    },
  });

  return (
    <AdminPageShell
      title="Dead-letter queue"
      description="Domain events that exhausted their NATS retries. Inspect, retry, or discard."
      actions={
        <Button size="sm" variant="outline" onClick={() => invalidate()}>
          <RefreshCcw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground text-sm font-bold uppercase tracking-wide">
            No failed events. Everything is flowing.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm font-mono truncate">{e.subject}</code>
                    <Badge variant="secondary">attempt {e.attempt}</Badge>
                    {e.consumed_at && <Badge>resolved</Badge>}
                  </div>
                  {e.error && (
                    <p className="text-xs text-destructive mt-1 line-clamp-2">{e.error}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(e.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setInspect(e)}>
                    Inspect
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    disabled={!!e.consumed_at || retryMutation.isPending}
                    onClick={() => retryMutation.mutate(e.id)}
                  >
                    <RotateCw className="h-3.5 w-3.5 mr-1" /> Retry
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setPendingDiscard(e)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Discard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {total > limit && (
            <div className="flex justify-between pt-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <p className="text-xs text-muted-foreground self-center">
                Page {page + 1} · {total} total
              </p>
              <Button
                size="sm"
                variant="outline"
                disabled={(page + 1) * limit >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={pendingDiscard !== null}
        onOpenChange={(o) => {
          if (!o) setPendingDiscard(null);
        }}
        variant="destructive"
        title="Discard this entry permanently?"
        description={
          pendingDiscard
            ? `${pendingDiscard.subject} — attempt ${pendingDiscard.attempt}. The original event will not be re-processed.`
            : undefined
        }
        confirmText="Discard"
        onConfirm={async () => {
          if (!pendingDiscard) return;
          await deleteMutation.mutateAsync(pendingDiscard.id);
          setPendingDiscard(null);
        }}
      />

      <Dialog open={!!inspect} onOpenChange={(v) => !v && setInspect(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>DLQ entry #{inspect?.id}</DialogTitle>
          </DialogHeader>
          {inspect && (
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Subject</p>
                <code className="text-sm font-mono">{inspect.subject}</code>
              </div>
              {inspect.error && (
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Error</p>
                  <p className="text-sm text-destructive whitespace-pre-wrap">{inspect.error}</p>
                </div>
              )}
              <div>
                <p className="text-xs uppercase text-muted-foreground">Payload</p>
                <pre className="border bg-secondary/40 p-3 text-xs overflow-auto max-h-80 font-mono">
                  {JSON.stringify(inspect.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
