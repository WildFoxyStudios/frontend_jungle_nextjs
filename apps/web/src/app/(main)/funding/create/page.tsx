"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { commerceApi } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@jungle/ui";
import { toast } from "sonner";

export default function CreateFundingPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", goal_amount: "", currency: "USD", end_date: "" });
  const [isLoading, setIsLoading] = useState(false);
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const goal = parseFloat(form.goal_amount);
    if (!form.title.trim() || isNaN(goal) || goal <= 0) return;
    setIsLoading(true);
    try {
      const campaign = await commerceApi.createFunding({ title: form.title, description: form.description, goal_amount: goal, currency: form.currency, end_date: form.end_date || undefined });
      router.push("/funding/" + campaign.id);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create campaign"); }
    finally { setIsLoading(false); }
  };
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader><CardTitle>Start a Fundraiser</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={(e) => update("title", e.target.value)} /></div>
            <div className="space-y-1"><Label>Story</Label><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Goal Amount *</Label><Input type="number" min="1" value={form.goal_amount} onChange={(e) => update("goal_amount", e.target.value)} /></div>
              <div className="space-y-1"><Label>Currency</Label><Input value={form.currency} onChange={(e) => update("currency", e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label>End date</Label><Input type="date" value={form.end_date} onChange={(e) => update("end_date", e.target.value)} /></div>
            <Button type="submit" disabled={isLoading || !form.title.trim() || !form.goal_amount} className="w-full">{isLoading ? "Creating…" : "Start campaign"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}