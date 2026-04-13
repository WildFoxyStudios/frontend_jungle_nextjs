"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { jobsApi } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@jungle/ui";
import { toast } from "sonner";

export default function CreateJobPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", category: "", location: "", salary_min: "", salary_max: "", currency: "USD", job_type: "full_time" });
  const [isLoading, setIsLoading] = useState(false);
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setIsLoading(true);
    try {
      const job = await jobsApi.createJob({
        title: form.title, description: form.description, category: form.category,
        location: form.location, job_type: form.job_type as "full_time" | "part_time" | "contract" | "freelance" | "internship",
        salary_min: form.salary_min ? Number(form.salary_min) : undefined,
        salary_max: form.salary_max ? Number(form.salary_max) : undefined,
        currency: form.currency,
      });
      router.push("/jobs/" + job.id);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to create job"); }
    finally { setIsLoading(false); }
  };
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader><CardTitle>Post a Job</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1"><Label>Title *</Label><Input value={form.title} onChange={(e) => update("title", e.target.value)} /></div>
            <div className="space-y-1"><Label>Description *</Label><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={5} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Category</Label><Input value={form.category} onChange={(e) => update("category", e.target.value)} /></div>
              <div className="space-y-1"><Label>Location</Label><Input value={form.location} onChange={(e) => update("location", e.target.value)} /></div>
            </div>
            <div className="space-y-1">
              <Label>Job type</Label>
              <Select value={form.job_type} onValueChange={(v) => update("job_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1"><Label>Min salary</Label><Input type="number" value={form.salary_min} onChange={(e) => update("salary_min", e.target.value)} /></div>
              <div className="space-y-1"><Label>Max salary</Label><Input type="number" value={form.salary_max} onChange={(e) => update("salary_max", e.target.value)} /></div>
              <div className="space-y-1"><Label>Currency</Label><Input value={form.currency} onChange={(e) => update("currency", e.target.value)} /></div>
            </div>
            <Button type="submit" disabled={isLoading || !form.title.trim()} className="w-full">{isLoading ? "Posting…" : "Post job"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}