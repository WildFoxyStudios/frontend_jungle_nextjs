"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pagesApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import { useMediaUpload } from "@jungle/hooks";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Skeleton } from "@jungle/ui";
import { toast } from "sonner";

interface Props { params: Promise<{ slug: string }> }

export default function PageSettingsPage({ params }: Props) {
  const { slug } = use(params);
  const router = useRouter();
  const { uploadImage, isUploading } = useMediaUpload();
  const [page, setPage] = useState<Page | null>(null);
  const [form, setForm] = useState({ name: "", description: "", category: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    pagesApi.getPage(slug).then((p) => {
      setPage(p);
      setForm({ name: p.name, description: p.description, category: p.category });
    }).catch(() => toast.error("Failed to load page"))
    .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    try {
      await pagesApi.updatePage(page.id, form as Partial<Page>);
      toast.success("Page settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!page) return;
    if (!confirm("Delete this page? This cannot be undone.")) return;
    try {
      await pagesApi.deletePage(page.id);
      toast.success("Page deleted");
      router.push("/pages");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete page");
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!page) return;
    const file = e.target.files?.[0]; if (!file) return;
    const media = await uploadImage(file, "avatar");
    if (media) {
      const fd = new FormData(); fd.append("avatar", file);
      await pagesApi.updatePage(page.id, { avatar: media.url } as Partial<Page>);
      setPage((p) => p ? { ...p, avatar: media.url } : p);
      toast.success("Avatar updated");
    }
    e.target.value = "";
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!page) return <p className="text-center mt-8 text-muted-foreground">Page not found or access denied.</p>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Page Settings</h1>
      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5"><Label>Page name</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} /></div>
          <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => update("category", e.target.value)} /></div>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Page Avatar</CardTitle></CardHeader>
        <CardContent>
          <input type="file" accept="image/*" className="hidden" id="page-avatar" onChange={handleAvatarChange} />
          <label htmlFor="page-avatar">
            <Button asChild variant="outline" disabled={isUploading}><span>{isUploading ? "Uploading…" : "Change avatar"}</span></Button>
          </label>
        </CardContent>
      </Card>
      <Card className="border-destructive">
        <CardHeader><CardTitle className="text-destructive">Danger Zone</CardTitle></CardHeader>
        <CardContent><Button variant="destructive" onClick={handleDelete}>Delete Page</Button></CardContent>
      </Card>
    </div>
  );
}