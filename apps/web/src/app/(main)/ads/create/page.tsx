"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { contentApi } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@jungle/ui";
import { toast } from "sonner";

export default function CreateAdPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", headline: "", description: "", url: "", audience: "all", bid_type: "cpm", daily_budget: "" });
  const [isLoading, setIsLoading] = useState(false);
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) return;
    setIsLoading(true);
    try {
      const ad = await contentApi.createUserAd({ name: form.name, headline: form.headline, description: form.description, url: form.url, audience: form.audience, bid_type: form.bid_type as "cpc" | "cpm", daily_budget: form.daily_budget ? Number(form.daily_budget) : 1 });
      router.push("/ads/" + ad.id + "/stats");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create ad"); }
    finally { setIsLoading(false); }
  };
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader><CardTitle>Create Ad</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1"><Label>Campaign name *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
            <div className="space-y-1"><Label>Headline</Label><Input value={form.headline} onChange={(e) => update("headline", e.target.value)} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} /></div>
            <div className="space-y-1"><Label>Destination URL *</Label><Input type="url" value={form.url} onChange={(e) => update("url", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Audience</Label>
                <Select value={form.audience} onValueChange={(v) => update("audience", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="followers">My followers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Bid type</Label>
                <Select value={form.bid_type} onValueChange={(v) => update("bid_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpm">Pay per view (CPM)</SelectItem>
                    <SelectItem value="cpc">Pay per click (CPC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Daily budget (USD)</Label><Input type="number" min="1" value={form.daily_budget} onChange={(e) => update("daily_budget", e.target.value)} /></div>
            <Button type="submit" disabled={isLoading || !form.name.trim() || !form.url.trim()} className="w-full">{isLoading ? "Creating…" : "Launch campaign"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}