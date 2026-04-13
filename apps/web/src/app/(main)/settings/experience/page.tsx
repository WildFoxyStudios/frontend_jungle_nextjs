"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usersApi } from "@jungle/api-client";
import type { UserExperience } from "@jungle/api-client";
import { Card, CardContent, Button, Input, Label, Textarea, Skeleton, Badge } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Trash2, Briefcase } from "lucide-react";

const expSchema = z.object({
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  location: z.string().optional(),
  description: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  is_current: z.boolean().default(false),
});

type ExpForm = z.infer<typeof expSchema>;

export default function ExperiencePage() {
  const [experiences, setExperiences] = useState<UserExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<ExpForm>({
    resolver: zodResolver(expSchema),
    defaultValues: { is_current: false },
  });

  const isCurrent = watch("is_current");

  useEffect(() => {
    usersApi.getExperience()
      .then(setExperiences)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data: ExpForm) => {
    try {
      const created = await usersApi.addExperience({
        ...data,
        end_date: data.is_current ? undefined : data.end_date,
      });
      setExperiences((prev) => [...prev, created]);
      reset();
      setShowForm(false);
      toast.success("Experience added");
    } catch {
      toast.error("Failed to add experience");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await usersApi.deleteExperience(id);
      setExperiences((prev) => prev.filter((e) => e.id !== id));
      toast.success("Experience removed");
    } catch {
      toast.error("Failed to remove experience");
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Work Experience</h2>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> Add Experience
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Job Title *</Label>
                  <Input {...register("title")} placeholder="e.g. Software Engineer" />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Company *</Label>
                  <Input {...register("company")} placeholder="e.g. Acme Corp" />
                  {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input {...register("location")} placeholder="e.g. New York, NY" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea {...register("description")} rows={2} placeholder="Describe your role…" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start Date *</Label>
                  <Input type="month" {...register("start_date")} />
                  {errors.start_date && <p className="text-xs text-destructive">{errors.start_date.message}</p>}
                </div>
                {!isCurrent && (
                  <div className="space-y-1.5">
                    <Label>End Date</Label>
                    <Input type="month" {...register("end_date")} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_current" {...register("is_current")} className="h-4 w-4" />
                <Label htmlFor="is_current">I currently work here</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save"}</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); reset(); }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {experiences.length === 0 && !showForm && (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No work experience added yet.</CardContent></Card>
      )}

      {experiences.map((exp) => (
        <Card key={exp.id}>
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 bg-muted rounded-lg shrink-0">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="font-semibold">{exp.title}</p>
              <p className="text-sm text-muted-foreground">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</p>
              <p className="text-xs text-muted-foreground">
                {exp.start_date} — {exp.is_current ? <Badge variant="secondary" className="text-xs">Present</Badge> : exp.end_date}
              </p>
              {exp.description && <p className="text-sm mt-1">{exp.description}</p>}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleDelete(exp.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
