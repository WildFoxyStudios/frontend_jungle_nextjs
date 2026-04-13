"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { contentApi } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@jungle/ui";
import { toast } from "sonner";

export default function CreateDeveloperAppPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "", website: "", callback_url: "" });
  const [isLoading, setIsLoading] = useState(false);
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.website.trim() || !form.callback_url.trim()) return;
    setIsLoading(true);
    try {
      const app = await contentApi.createDeveloperApp(form);
      router.push("/developers/apps/" + app.id);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create app"); }
    finally { setIsLoading(false); }
  };
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader><CardTitle>Create OAuth App</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1"><Label>App name *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} /></div>
            <div className="space-y-1"><Label>Website URL *</Label><Input type="url" value={form.website} onChange={(e) => update("website", e.target.value)} /></div>
            <div className="space-y-1"><Label>Callback URL *</Label><Input type="url" value={form.callback_url} onChange={(e) => update("callback_url", e.target.value)} /></div>
            <Button type="submit" disabled={isLoading || !form.name.trim() || !form.website.trim() || !form.callback_url.trim()} className="w-full">{isLoading ? "Creating…" : "Create app"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}