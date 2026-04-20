"use client";

import { use, useEffect, useState } from "react";
import { pagesApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import { useMediaUpload } from "@jungle/hooks";
import {
  Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Skeleton,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@jungle/ui";
import { toast } from "sonner";

const CALL_ACTION_OPTIONS = [
  { value: "", label: "None" },
  { value: "book_now", label: "Book Now" },
  { value: "contact_us", label: "Contact Us" },
  { value: "learn_more", label: "Learn More" },
  { value: "shop_now", label: "Shop Now" },
  { value: "sign_up", label: "Sign Up" },
  { value: "watch_video", label: "Watch Video" },
  { value: "call_now", label: "Call Now" },
];

interface Props { params: Promise<{ slug: string }> }

interface FormState {
  name: string;
  description: string;
  category: string;
  website: string;
  address: string;
  phone: string;
  call_action_type: string;
  call_action_type_url: string;
}

export default function PageSettingsPage({ params }: Props) {
  const { slug } = use(params);
  const { uploadImage, isUploading } = useMediaUpload();
  const [page, setPage] = useState<Page | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "", description: "", category: "",
    website: "", address: "", phone: "",
    call_action_type: "", call_action_type_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    pagesApi.getPage(slug).then((p) => {
      setPage(p);
      setForm({
        name: p.name,
        description: p.description,
        category: p.category,
        website: p.website ?? "",
        address: p.address ?? "",
        phone: p.phone ?? "",
        call_action_type: p.call_action_type ?? "",
        call_action_type_url: p.call_action_type_url ?? "",
      });
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!page) return;
    const file = e.target.files?.[0]; if (!file) return;
    const media = await uploadImage(file, "avatar");
    if (media) {
      try {
        await pagesApi.updatePage(page.id, { avatar: media.url } as Partial<Page>);
        setPage((p) => p ? { ...p, avatar: media.url } : p);
        toast.success("Avatar updated");
      } catch {
        toast.error("Failed to update avatar");
      }
    }
    e.target.value = "";
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!page) return;
    const file = e.target.files?.[0]; if (!file) return;
    const media = await uploadImage(file, "cover");
    if (media) {
      try {
        await pagesApi.updatePage(page.id, { cover: media.url } as Partial<Page>);
        setPage((p) => p ? { ...p, cover: media.url } : p);
        toast.success("Cover updated");
      } catch {
        toast.error("Failed to update cover");
      }
    }
    e.target.value = "";
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!page) return <p className="text-center mt-8 text-muted-foreground">Page not found or access denied.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>General</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Page name</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input value={form.category} onChange={(e) => update("category", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Contact info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input type="url" placeholder="https://…" value={form.website}
              onChange={(e) => update("website", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Call to action</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Button type</Label>
            <Select value={form.call_action_type} onValueChange={(v) => update("call_action_type", v)}>
              <SelectTrigger><SelectValue placeholder="Select action…" /></SelectTrigger>
              <SelectContent>
                {CALL_ACTION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value || "none"} value={opt.value || "__none__"}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.call_action_type && form.call_action_type !== "__none__" && (
            <div className="space-y-1.5">
              <Label>Action URL</Label>
              <Input type="url" placeholder="https://…" value={form.call_action_type_url}
                onChange={(e) => update("call_action_type_url", e.target.value)} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Page Avatar</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {page.avatar && (
            <img src={page.avatar} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
          )}
          <input type="file" accept="image/*" className="hidden" id="page-avatar" onChange={handleAvatarChange} />
          <label htmlFor="page-avatar">
            <Button asChild variant="outline" disabled={isUploading}>
              <span>{isUploading ? "Uploading…" : "Change avatar"}</span>
            </Button>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Page Cover</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {page.cover && (
            <div className="aspect-[3/1] rounded-lg overflow-hidden bg-muted">
              <img src={page.cover} alt="Cover" className="w-full h-full object-cover" />
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" id="page-cover" onChange={handleCoverChange} />
          <label htmlFor="page-cover">
            <Button asChild variant="outline" disabled={isUploading}>
              <span>{isUploading ? "Uploading…" : page.cover ? "Change cover" : "Upload cover"}</span>
            </Button>
          </label>
        </CardContent>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}