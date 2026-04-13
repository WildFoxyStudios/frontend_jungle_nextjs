"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { groupsApi } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@jungle/ui";
import { toast } from "sonner";

export default function CreateGroupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", description: "", category: "", privacy: "public" });
  const [isLoading, setIsLoading] = useState(false);
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setIsLoading(true);
    try {
      const g = await groupsApi.createGroup({ name: form.name, description: form.description, category: form.category, privacy: form.privacy as "public" | "private" | "secret" });
      router.push(`/groups/${g.id}`);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create group"); }
    finally { setIsLoading(false); }
  };
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader><CardTitle>Create a Group</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1"><Label>Group name *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} /></div>
            <div className="space-y-1"><Label>Category</Label><Input value={form.category} onChange={(e) => update("category", e.target.value)} /></div>
            <div className="space-y-1">
              <Label>Privacy</Label>
              <Select value={form.privacy} onValueChange={(v) => update("privacy", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public – anyone can join</SelectItem>
                  <SelectItem value="private">Private – requires approval</SelectItem>
                  <SelectItem value="secret">Secret – invite only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isLoading || !form.name.trim()} className="w-full">{isLoading ? "Creating…" : "Create group"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}