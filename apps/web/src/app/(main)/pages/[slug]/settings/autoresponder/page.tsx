"use client";

import { use, useEffect, useState } from "react";
import { pagesApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton, Switch, Label, Textarea } from "@jungle/ui";
import { toast } from "sonner";
import { MessageSquare, Clock } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

export default function PageAutoresponder({ params }: Props) {
  const { slug } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [config, setConfig] = useState({
    enabled: false,
    message: "",
    delay_minutes: 5,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    pagesApi.getPage(slug).then((p) => {
      setPage(p);
      setConfig({
        enabled: p.autoresponder?.enabled ?? false,
        message: p.autoresponder?.message || "",
        delay_minutes: p.autoresponder?.delay_minutes || 5,
      });
    }).catch(() => toast.error("Failed to load page"))
    .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    try {
      await pagesApi.updatePage(page.id, { autoresponder: config });
      toast.success("Auto-reply settings updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!page) return <p className="text-center mt-8 text-muted-foreground">Page not found.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare size={20} /> Auto Reply</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Enable Auto Reply</Label>
              <p className="text-sm text-muted-foreground">Automatically respond to new messages</p>
            </div>
            <Switch checked={config.enabled} onCheckedChange={(v) => setConfig((c) => ({ ...c, enabled: v }))} />
          </div>
          {config.enabled && (
            <>
              <div className="space-y-2">
                <Label>Auto-reply message</Label>
                <Textarea
                  value={config.message}
                  onChange={(e) => setConfig((c) => ({ ...c, message: e.target.value }))}
                  placeholder="Enter the message that will be sent automatically..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">This message will be sent to anyone who messages your page.</p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock size={16} /> Delay (minutes)</Label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={config.delay_minutes}
                  onChange={(e) => setConfig((c) => ({ ...c, delay_minutes: parseInt(e.target.value) || 0 }))}
                  className="w-24 px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-muted-foreground">Time to wait before sending the auto-reply.</p>
              </div>
            </>
          )}
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
