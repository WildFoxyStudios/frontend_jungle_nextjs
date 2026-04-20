"use client";

import { use, useEffect, useState } from "react";
import { groupsApi } from "@jungle/api-client";
import type { Group } from "@jungle/api-client";
import { useMediaUpload } from "@jungle/hooks";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from "@jungle/ui";
import { toast } from "sonner";

interface Props { params: Promise<{ slug: string }> }

export default function GroupSettingsPage({ params }: Props) {
  const { slug } = use(params);
  const { uploadImage, isUploading } = useMediaUpload();
  const [group, setGroup] = useState<Group | null>(null);
  const [form, setForm] = useState({ name: "", description: "", category: "", privacy: "public" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    groupsApi.getGroup(slug).then((g) => {
      setGroup(g);
      setForm({ name: g.name, description: g.description, category: g.category, privacy: g.privacy });
    }).catch(() => toast.error("Failed to load group"))
    .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    if (!group) return;
    setSaving(true);
    try {
      await groupsApi.updateGroup(group.id, form as Partial<Group>);
      toast.success("Group settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!group) return;
    const file = e.target.files?.[0]; if (!file) return;
    const media = await uploadImage(file, "avatar");
    if (media) {
      const fd = new FormData(); fd.append("avatar", file);
      const res = await groupsApi.uploadGroupAvatar(group.id, fd);
      setGroup((g) => g ? { ...g, avatar: res.avatar } : g);
      toast.success("Avatar updated");
    }
    e.target.value = "";
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!group) return <p className="text-center mt-8 text-muted-foreground">Group not found or access denied.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5"><Label>Group name</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} /></div>
          <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => update("category", e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Privacy</Label>
            <Select value={form.privacy} onValueChange={(v) => update("privacy", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private (requires approval)</SelectItem>
                <SelectItem value="secret">Secret (invite only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Group Avatar</CardTitle></CardHeader>
        <CardContent>
          <input type="file" accept="image/*" className="hidden" id="group-avatar" onChange={handleAvatarChange} />
          <label htmlFor="group-avatar">
            <Button asChild variant="outline" disabled={isUploading}><span>{isUploading ? "Uploading…" : "Change avatar"}</span></Button>
          </label>
        </CardContent>
      </Card>

      <GroupCoverCard group={group} />

    </div>
  );
}

function GroupCoverCard({ group }: { group: Group }) {
  const { uploadImage, isUploading } = useMediaUpload();
  const [coverUrl, setCoverUrl] = useState(group.cover || "");

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const media = await uploadImage(file, "cover");
    if (media) {
      try {
        await groupsApi.updateGroup(group.id, { cover: media.url });
        setCoverUrl(media.url);
        toast.success("Cover updated");
      } catch {
        toast.error("Failed to update cover");
      }
    }
    e.target.value = "";
  };

  return (
    <Card>
      <CardHeader><CardTitle>Group Cover</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {coverUrl && (
          <div className="aspect-[3/1] rounded-lg overflow-hidden bg-muted">
            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
          </div>
        )}
        <input type="file" accept="image/*" className="hidden" id="group-cover" onChange={handleCoverChange} />
        <label htmlFor="group-cover">
          <Button asChild variant="outline" disabled={isUploading}><span>{isUploading ? "Uploading…" : coverUrl ? "Change cover" : "Upload cover"}</span></Button>
        </label>
      </CardContent>
    </Card>
  );
}