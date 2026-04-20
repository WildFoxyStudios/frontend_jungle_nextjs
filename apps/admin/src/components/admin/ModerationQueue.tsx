"use client";

import { useState } from "react";
import { Button, Card, CardContent, Badge, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle, Checkbox } from "@jungle/ui";
import { ConfirmDialog } from "@jungle/ui";
import { toast } from "sonner";
import { Eye, CheckCircle, XCircle } from "lucide-react";

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
  enableBatchActions?: boolean;
}

export function ModerationQueue({ 
  items, 
  isLoading, 
  onApprove, 
  onReject, 
  onRefetch, 
  renderItem,
  enableBatchActions = false 
}: ModerationQueueProps) {
  const [previewItem, setPreviewItem] = useState<QueueItem | null>(null);
  const [rejectConfirmId, setRejectConfirmId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No items in queue.</p>
      </div>
    );
  }

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBatchApprove = async () => {
    if (!onApprove || selectedIds.size === 0) return;
    setBatchProcessing(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => onApprove(id)));
      toast.success(`Approved ${selectedIds.size} items`);
      setSelectedIds(new Set());
      onRefetch?.();
    } catch {
      toast.error("Batch approve failed");
    } finally {
      setBatchProcessing(false);
    }
  };

  const handleBatchReject = async () => {
    if (!onReject || selectedIds.size === 0) return;
    setBatchProcessing(true);
    try {
      await Promise.all(Array.from(selectedIds).map(id => onReject(id)));
      toast.success(`Rejected ${selectedIds.size} items`);
      setSelectedIds(new Set());
      onRefetch?.();
    } catch {
      toast.error("Batch reject failed");
    } finally {
      setBatchProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      {enableBatchActions && selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex-1" />
          {onApprove && (
            <Button size="sm" onClick={handleBatchApprove} disabled={batchProcessing}>
              <CheckCircle className="h-4 w-4 mr-1" /> Approve All
            </Button>
          )}
          {onReject && (
            <Button size="sm" variant="destructive" onClick={handleBatchReject} disabled={batchProcessing}>
              <XCircle className="h-4 w-4 mr-1" /> Reject All
            </Button>
          )}
        </div>
      )}

      {items.map((item) => (
        <Card key={item.id} className={selectedIds.has(item.id) ? "border-primary" : undefined}>
          <CardContent className="p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {enableBatchActions && (
                <Checkbox 
                  checked={selectedIds.has(item.id)} 
                  onCheckedChange={() => toggleSelection(item.id)}
                  className="mt-1"
                />
              )}
              <div className="flex-1 min-w-0">
                {renderItem ? renderItem(item) : (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {item.type && <Badge variant="secondary">{item.type}</Badge>}
                      <span className="text-xs text-muted-foreground">#{item.id}</span>
                    </div>
                    {item.title && <p className="font-medium text-sm">{item.title}</p>}
                    {item.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                    )}
                    {item.created_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPreviewItem(item)}
              >
                <Eye className="h-4 w-4" />
              </Button>
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
                  onClick={() => setRejectConfirmId(item.id)}
                >
                  Reject
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Preview Modal */}
      <Dialog open={previewItem !== null} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              {previewItem.type && <Badge>{previewItem.type}</Badge>}
              {previewItem.title && <h3 className="font-semibold">{previewItem.title}</h3>}
              {previewItem.content && (
                <div className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-md">
                  {previewItem.content}
                </div>
              )}
              {previewItem.created_at && (
                <p className="text-xs text-muted-foreground">
                  Submitted: {new Date(previewItem.created_at).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation */}
      <ConfirmDialog
        open={rejectConfirmId !== null}
        onOpenChange={(open) => !open && setRejectConfirmId(null)}
        title="Reject Item"
        description="Are you sure you want to reject this item? This action cannot be undone."
        confirmText="Reject"
        variant="destructive"
        onConfirm={async () => {
          if (rejectConfirmId && onReject) {
            try {
              await onReject(rejectConfirmId);
              toast.success("Rejected");
              onRefetch?.();
            } catch { toast.error("Failed"); }
          }
          setRejectConfirmId(null);
        }}
      />
    </div>
  );
}
