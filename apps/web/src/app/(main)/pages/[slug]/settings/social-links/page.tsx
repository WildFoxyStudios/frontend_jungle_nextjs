"use client";

import { use, useEffect, useState } from "react";
import { pagesApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { Facebook, Twitter, Linkedin, Instagram, Youtube, Github, Globe } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

export default function PageSocialLinks({ params }: Props) {
  const { slug } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [links, setLinks] = useState({
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
    youtube: "",
    github: "",
    website: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    pagesApi.getPage(slug).then((p) => {
      setPage(p);
      setLinks({
        facebook: p.social_links?.facebook || "",
        twitter: p.social_links?.twitter || "",
        linkedin: p.social_links?.linkedin || "",
        instagram: p.social_links?.instagram || "",
        youtube: p.social_links?.youtube || "",
        github: p.social_links?.github || "",
        website: p.social_links?.website || "",
      });
    }).catch(() => toast.error("Failed to load page"))
    .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    try {
      await pagesApi.updatePage(page.id, { social_links: links });
      toast.success("Social links updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  };

  const update = (k: string, v: string) => setLinks((l) => ({ ...l, [k]: v }));

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!page) return <p className="text-center mt-8 text-muted-foreground">Page not found.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Facebook size={16} /> Facebook URL</Label>
            <Input value={links.facebook} onChange={(e) => update("facebook", e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Twitter size={16} /> Twitter/X URL</Label>
            <Input value={links.twitter} onChange={(e) => update("twitter", e.target.value)} placeholder="https://twitter.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Linkedin size={16} /> LinkedIn URL</Label>
            <Input value={links.linkedin} onChange={(e) => update("linkedin", e.target.value)} placeholder="https://linkedin.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Instagram size={16} /> Instagram URL</Label>
            <Input value={links.instagram} onChange={(e) => update("instagram", e.target.value)} placeholder="https://instagram.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Youtube size={16} /> YouTube URL</Label>
            <Input value={links.youtube} onChange={(e) => update("youtube", e.target.value)} placeholder="https://youtube.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Github size={16} /> GitHub URL</Label>
            <Input value={links.github} onChange={(e) => update("github", e.target.value)} placeholder="https://github.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Globe size={16} /> Website URL</Label>
            <Input value={links.website} onChange={(e) => update("website", e.target.value)} placeholder="https://..." />
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
