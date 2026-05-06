"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usersApi } from "@jungle/api-client";
import type { UserProject } from "@jungle/api-client";
import {
 Button,
 Card,
 CardContent,
 CardHeader,
 CardTitle,
 Input,
 Label,
 Textarea,
 Badge,
} from "@jungle/ui";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const projectFormSchema = z.object({
 title: z.string().min(1, "Required").max(160),
 description: z.string().max(2000).optional(),
 url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
 tags: z.string().max(400).optional(),
});

type ProjectForm = z.infer<typeof projectFormSchema>;

export default function ProjectsSettingsPage() {
 const [projects, setProjects] = useState<UserProject[]>([]);
 const [isAdding, setIsAdding] = useState(false);

 const {
 register,
 handleSubmit,
 reset,
 formState: { errors, isSubmitting },
 } = useForm<ProjectForm>({
 resolver: zodResolver(projectFormSchema),
 defaultValues: { title: "", description: "", url: "", tags: "" },
 });

 useEffect(() => {
 usersApi.getProjects().then(setProjects).catch(() => {
 /* non-critical: failure is silent */
 });
 }, []);

 const cancelAdd = () => {
 setIsAdding(false);
 reset({ title: "", description: "", url: "", tags: "" });
 };

 const onAdd = handleSubmit(async (data) => {
 try {
 const created = await usersApi.addProject({
 title: data.title.trim(),
 description: data.description?.trim() ? data.description.trim() : undefined,
 url: data.url?.trim() ? data.url.trim() : undefined,
 tags: data.tags?.trim()
 ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
 : [],
 });
 setProjects((prev) => [...prev, created]);
 reset({ title: "", description: "", url: "", tags: "" });
 setIsAdding(false);
 toast.success("Project added");
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to add project");
 }
 });

 const handleDelete = async (id: number) => {
 try {
 await usersApi.deleteProject(id);
 setProjects((prev) => prev.filter((p) => p.id !== id));
 toast.success("Project deleted");
 } catch {
 toast.error("Failed to delete project");
 }
 };

 return (
 <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
 <div className="flex items-center justify-between">
 <h1 className="text-2xl font-bold">Projects</h1>
 <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
 <Plus className="mr-1 h-4 w-4" /> Add project
 </Button>
 </div>

 {isAdding && (
 <Card>
 <CardContent className="space-y-3 pt-4">
 <form onSubmit={onAdd} className="space-y-3">
 <div className="space-y-1">
 <Label htmlFor="proj-title">Title *</Label>
 <Input id="proj-title" {...register("title")} />
 {errors.title && (
 <p className="text-xs text-destructive">{errors.title.message}</p>
 )}
 </div>
 <div className="space-y-1">
 <Label htmlFor="proj-desc">Description</Label>
 <Textarea id="proj-desc" {...register("description")} rows={2} />
 {errors.description && (
 <p className="text-xs text-destructive">{errors.description.message}</p>
 )}
 </div>
 <div className="space-y-1">
 <Label htmlFor="proj-url">URL</Label>
 <Input id="proj-url" type="url" {...register("url")} />
 {errors.url && (
 <p className="text-xs text-destructive">{errors.url.message}</p>
 )}
 </div>
 <div className="space-y-1">
 <Label htmlFor="proj-tags">Tags (comma-separated)</Label>
 <Input
 id="proj-tags"
 {...register("tags")}
 placeholder="react, typescript, rust"
 />
 {errors.tags && (
 <p className="text-xs text-destructive">{errors.tags.message}</p>
 )}
 </div>
 <div className="flex gap-2">
 <Button type="submit" disabled={isSubmitting}>
 {isSubmitting ? "Adding…" : "Add"}
 </Button>
 <Button type="button" variant="ghost" onClick={cancelAdd}>
 Cancel
 </Button>
 </div>
 </form>
 </CardContent>
 </Card>
 )}

 <div className="space-y-3">
 {projects.map((p) => (
 <Card key={p.id}>
 <CardHeader className="pb-2">
 <div className="flex items-start justify-between">
 <div>
 <CardTitle className="text-base">{p.title}</CardTitle>
 {p.url && (
 <a
 href={p.url}
 target="_blank"
 rel="noopener noreferrer"
 className="text-xs text-primary hover:underline"
 >
 {p.url}
 </a>
 )}
 </div>
 <button
 type="button"
 onClick={() => handleDelete(p.id)}
 className="text-destructive hover:text-destructive/80"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 </CardHeader>
 {(p.description || p.tags?.length) && (
 <CardContent className="space-y-2 pt-0">
 {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
 {Boolean(p.tags?.length) && (
 <div className="flex flex-wrap gap-1">
 {p.tags?.map((tag) => (
 <Badge key={tag} variant="secondary" className="text-xs">
 {tag}
 </Badge>
 ))}
 </div>
 )}
 </CardContent>
 )}
 </Card>
 ))}
 {projects.length === 0 && !isAdding && (
 <p className="py-8 text-center text-sm text-muted-foreground">No projects yet.</p>
 )}
 </div>
 </div>
 );
}
