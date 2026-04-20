"use client";

import { use, useEffect, useState } from "react";
import { pagesApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton, Switch, Label } from "@jungle/ui";
import { toast } from "sonner";
import { Bell, MessageCircle, ThumbsUp, Users, UserPlus } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

export default function PageNotifications({ params }: Props) {
  const { slug } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [settings, setSettings] = useState({
    new_follower: true,
    new_like: true,
    new_comment: true,
    new_mention: true,
    new_message: true,
    new_review: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    pagesApi.getPage(slug).then((p) => {
      setPage(p);
      setSettings({
        new_follower: p.notification_settings?.new_follower ?? true,
        new_like: p.notification_settings?.new_like ?? true,
        new_comment: p.notification_settings?.new_comment ?? true,
        new_mention: p.notification_settings?.new_mention ?? true,
        new_message: p.notification_settings?.new_message ?? true,
        new_review: p.notification_settings?.new_review ?? true,
      });
    }).catch(() => toast.error("Failed to load page"))
    .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    try {
      await pagesApi.updatePage(page.id, { notification_settings: settings });
      toast.success("Notification settings updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  };

  const toggle = (k: keyof typeof settings) => setSettings((s) => ({ ...s, [k]: !s[k] }));

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!page) return <p className="text-center mt-8 text-muted-foreground">Page not found.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell size={20} /> Notification Settings</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus size={18} className="text-muted-foreground" />
              <div>
                <Label className="font-medium">New Followers</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone follows your page</p>
              </div>
            </div>
            <Switch checked={settings.new_follower} onCheckedChange={() => toggle("new_follower")} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ThumbsUp size={18} className="text-muted-foreground" />
              <div>
                <Label className="font-medium">New Likes</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone likes your post</p>
              </div>
            </div>
            <Switch checked={settings.new_like} onCheckedChange={() => toggle("new_like")} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle size={18} className="text-muted-foreground" />
              <div>
                <Label className="font-medium">New Comments</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone comments on your post</p>
              </div>
            </div>
            <Switch checked={settings.new_comment} onCheckedChange={() => toggle("new_comment")} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-muted-foreground" />
              <div>
                <Label className="font-medium">Mentions</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone mentions your page</p>
              </div>
            </div>
            <Switch checked={settings.new_mention} onCheckedChange={() => toggle("new_mention")} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={18} className="text-muted-foreground" />
              <div>
                <Label className="font-medium">New Messages</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone sends a message</p>
              </div>
            </div>
            <Switch checked={settings.new_message} onCheckedChange={() => toggle("new_message")} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ThumbsUp size={18} className="text-muted-foreground" />
              <div>
                <Label className="font-medium">New Reviews</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone leaves a review</p>
              </div>
            </div>
            <Switch checked={settings.new_review} onCheckedChange={() => toggle("new_review")} />
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
