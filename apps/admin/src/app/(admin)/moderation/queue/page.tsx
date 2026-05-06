"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@jungle/ui";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { toast } from "sonner";
import { Check, X, RefreshCw, ShieldCheck } from "lucide-react";

interface ModerationItem {
  id: number;
  text?: string;
  description?: string;
  title?: string;
  type?: string;
  user_id?: number;
  username?: string;
  user_data?: { username?: string; avatar?: string; name?: string };
  status?: string;
  active?: string | number;
  posted?: string;
  time?: string;
  score?: number;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "soft-warning",
  active: "soft-success",
  approved: "soft-success",
  rejected: "destructive",
  deleted: "secondary",
  auto_blocked: "destructive",
  human_review: "soft-warning",
};

export default function ModerationQueuePage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (filter !== "all") params.status = filter;
      const result = await adminApi.getPendingPosts(params);
      setItems((result?.data ?? []) as ModerationItem[]);
    } catch (e: any) {
      setError(e.message || "Failed to load moderation queue");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: number) {
    setActionLoading(id);
    try {
      await adminApi.approvePost(id);
      toast.success("Post approved");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Failed to approve post");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: number) {
    setActionLoading(id);
    try {
      await adminApi.rejectPost(id);
      toast.success("Post rejected");
      loadData();
    } catch (e: any) {
      toast.error(e.message || "Failed to reject post");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-destructive">Error: {error}</div>;

  const pendingCount = items.filter(
    (i) => i.status === "pending" || i.active === "0" || i.active === 0
  ).length;

  return (
    <AdminPageShell title="Moderation Queue" description="Unified AI and human review queue"><div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Moderation Queue</h1>
        <div className="flex gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="auto_blocked">Auto Blocked</SelectItem>
              <SelectItem value="human_review">Human Review</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Pending Review
            <Badge variant="soft-warning" className="ml-2">
              {pendingCount}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <ShieldCheck className="mx-auto h-12 w-12 mb-3 opacity-20" />
              <p>All clear — no items require moderation.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const status =
                    item.status ||
                    (item.active === "0" || item.active === 0
                      ? "pending"
                      : "active");
                  const badgeVariant = STATUS_STYLES[status] ?? "secondary";

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-xs truncate">
                        {item.text ||
                          item.description ||
                          item.title ||
                          `Post #${item.id}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.type || "post"}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.user_data?.username ||
                          item.username ||
                          `User #${item.user_id}`}
                      </TableCell>
                      <TableCell>
                        {item.score != null ? item.score : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={badgeVariant as "default" | "secondary" | "destructive" | "outline"}
                          className="capitalize"
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(item.id)}
                            disabled={actionLoading === item.id}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(item.id)}
                            disabled={actionLoading === item.id}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div></AdminPageShell>
  );
}
