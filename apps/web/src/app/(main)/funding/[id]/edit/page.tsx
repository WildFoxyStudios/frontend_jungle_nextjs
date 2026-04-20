"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { commerceApi } from "@jungle/api-client";
import type { Funding } from "@jungle/api-client";
import {
  Card, CardContent, CardHeader, CardTitle, Button, Input, Label,
  Textarea, Skeleton, Progress,
} from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

export default function EditFundingPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<Funding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [form, setForm] = useState({
    title: "",
    description: "",
    goal_amount: "",
    currency: "USD",
    end_date: "",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    commerceApi.getFundingCampaign(Number(id))
      .then((c) => {
        setCampaign(c);
        setForm({
          title: c.title,
          description: c.description ?? "",
          goal_amount: String(c.goal_amount),
          currency: c.currency,
          end_date: c.end_date ? c.end_date.split("T")[0] : "",
        });
        setCoverPreview(c.cover ?? "");
      })
      .catch(() => toast.error("Campaign not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const goal = parseFloat(form.goal_amount);
    if (!form.title.trim() || isNaN(goal) || goal <= 0) { toast.error("Title and goal amount are required"); return; }
    setSaving(true);
    try {
      let coverUrl = campaign?.cover;

      if (coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        fd.append("type", "funding_cover");
        const { mediaApi } = await import("@jungle/api-client");
        const uploaded = await mediaApi.uploadMedia(fd, (pct) => setUploadProgress(pct));
        coverUrl = uploaded.url;
      }

      await commerceApi.updateFunding(Number(id), {
        title: form.title,
        description: form.description,
        goal_amount: goal,
        currency: form.currency,
        end_date: form.end_date || undefined,
        cover: coverUrl,
      });
      toast.success("Campaign updated!");
      router.push(`/funding/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update campaign");
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  if (loading) return <Skeleton className="h-96 w-full max-w-2xl mx-auto mt-4" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/funding/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Campaign</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Campaign Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Cover image */}
            <div className="space-y-1.5">
              <Label>Cover Image</Label>
              <div
                className="relative h-40 bg-muted rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => document.getElementById("cover-upload")?.click()}
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <Upload className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">Change cover</span>
                </div>
              </div>
              <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <Progress value={uploadProgress} className="h-1" />
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => update("title", e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label>Story / Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                placeholder="Tell people about your campaign…"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Goal Amount *</Label>
                <Input type="number" min="1" step="0.01" value={form.goal_amount}
                  onChange={(e) => update("goal_amount", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input value={form.currency} onChange={(e) => update("currency", e.target.value)} maxLength={3} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={(e) => update("end_date", e.target.value)} />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving || !form.title.trim()} className="flex-1">
                {saving ? "Saving…" : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/funding/${id}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
