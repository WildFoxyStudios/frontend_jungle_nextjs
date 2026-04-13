"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mediaApi } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@jungle/ui";
import { toast } from "sonner";

export default function CreateAlbumPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "" });
  const [isLoading, setIsLoading] = useState(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsLoading(true);
    try {
      const album = await mediaApi.createAlbum({ name: form.name, description: form.description || undefined });
      router.push("/albums/" + album.id);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create album"); }
    finally { setIsLoading(false); }
  };
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader><CardTitle>Create Album</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1"><Label>Album name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <Button type="submit" disabled={isLoading || !form.name.trim()} className="w-full">{isLoading ? "Creating…" : "Create album"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}