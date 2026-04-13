"use client";

import { Button, Card, CardContent, Badge } from "@jungle/ui";
import { toast } from "sonner";

interface QueueItem {
  id: number;
  title?: string;
  content?: string;
  type?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface ModerationQueueProps {
  items: QueueItem[];
  isLoading?: boolean;
  onApprove?: (id: number) => Promise<void>;
  onReject?: (id: number) => Promise<void>;
  onRefetch?: () => void;
  renderItem?: (item: QueueItem) => React.ReactNode;
}

export function ModerationQueue({ items, isLoading, onApprove, onReject, onRefetch, renderItem }: ModerationQueueProps) {
  if (isLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (items.length === 0) return <div className="text-muted-foreground">No items in queue.</div>;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {renderItem ? renderItem(item) : (
                <div>
                  {item.type && <Badge variant="secondary" className="mb-1">{item.type}</Badge>}
                  {item.title && <p className="font-medium text-sm">{item.title}</p>}
                  {item.content && <p className="text-sm text-muted-foreground truncate">{item.content}</p>}
                  {item.created_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {onApprove && (
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      await onApprove(item.id);
                      toast.success("Approved");
                      onRefetch?.();
                    } catch { toast.error("Failed"); }
                  }}
                >
                  Approve
                </Button>
              )}
              {onReject && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await onReject(item.id);
                      toast.success("Rejected");
                      onRefetch?.();
                    } catch { toast.error("Failed"); }
                  }}
                >
                  Reject
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
