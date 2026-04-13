"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Input, Label, Card, CardContent, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface Template { id: number; color_1: string; color_2: string; text_color: string }

export default function ColoredPostsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ color_1: "#3b82f6", color_2: "#8b5cf6", text_color: "#ffffff" });

  const { data, isLoading } = useQuery({ queryKey: ["admin", "colored-posts"], queryFn: () => adminApi.getColoredPostTemplates() });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createColoredPostTemplate(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "colored-posts"] }); setOpen(false); toast.success("Template created"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteColoredPostTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "colored-posts"] }); toast.success("Deleted"); },
  });

  const templates = (data ?? []) as Template[];

  return (
    <AdminPageShell title="Colored Post Templates" actions={
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Template</Button>
    }>
      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {templates.map((t) => (
            <Card key={t.id} className="group relative overflow-hidden">
              <div
                className="h-20 w-full"
                style={{ background: `linear-gradient(135deg, ${t.color_1}, ${t.color_2})` }}
              />
              <Button
                variant="destructive" size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteMutation.mutate(t.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </Card>
          ))}
          {templates.length === 0 && <p className="col-span-full text-muted-foreground text-sm">No templates yet.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Colored Post Template</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {(["color_1", "color_2", "text_color"] as const).map((field) => (
              <div key={field} className="flex items-center gap-3">
                <Label className="w-28 capitalize">{field.replace("_", " ")}</Label>
                <input type="color" value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="h-9 w-16 rounded border cursor-pointer" />
                <Input value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="flex-1 font-mono text-sm" />
              </div>
            ))}
            <div className="h-16 rounded-lg mt-2" style={{ background: `linear-gradient(135deg, ${form.color_1}, ${form.color_2})` }}>
              <p className="text-center leading-[4rem] text-sm font-medium" style={{ color: form.text_color }}>Preview</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
