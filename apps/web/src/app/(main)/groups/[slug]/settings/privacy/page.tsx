"use client";

import { use, useEffect, useState } from "react";
import { groupsApi } from "@jungle/api-client";
import type { Group } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from "@jungle/ui";
import { toast } from "sonner";

interface Props { params: Promise<{ slug: string }> }

export default function GroupPrivacyPage({ params }: Props) {
  const { slug } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [privacy, setPrivacy] = useState("public");
  const [postPrivacy, setPostPrivacy] = useState("all");

  useEffect(() => {
    groupsApi.getGroup(slug)
      .then((g) => {
        setGroup(g);
        setPrivacy(g.privacy ?? "public");
        setPostPrivacy((g as Group & { post_privacy?: string }).post_privacy ?? "all");
      })
      .catch(() => toast.error("Failed to load group"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    if (!group) return;
    setSaving(true);
    try {
      await groupsApi.updateGroup(group.id, { privacy, post_privacy: postPrivacy } as Partial<Group>);
      toast.success("Privacy settings saved");
    } catch {
      toast.error("Failed to save privacy settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (!group) return <p className="text-muted-foreground">Group not found.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Privacy Settings</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>Group visibility</Label>
            <Select value={privacy} onValueChange={setPrivacy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public — anyone can find and view</SelectItem>
                <SelectItem value="private">Private — anyone can find, members only can see posts</SelectItem>
                <SelectItem value="secret">Secret — invite only, hidden from search</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Controls who can discover and view the group.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Who can post</Label>
            <Select value={postPrivacy} onValueChange={setPostPrivacy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All members</SelectItem>
                <SelectItem value="admin">Admins only</SelectItem>
                <SelectItem value="approved">Admins and moderators</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save privacy settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
