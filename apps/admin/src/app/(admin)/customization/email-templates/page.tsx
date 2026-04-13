"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Input, Label, Card, CardContent, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@jungle/ui";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface EmailTemplate { id: number; name: string; subject: string; body: string; variables: string[] }

export default function EmailTemplatesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState({ subject: "", body: "" });

  const { data, isLoading } = useQuery({ queryKey: ["admin", "email-templates"], queryFn: () => adminApi.getEmailTemplates() });

  const saveMutation = useMutation({
    mutationFn: () => adminApi.updateEmailTemplate(editing!.id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "email-templates"] }); setEditing(null); toast.success("Template saved"); },
  });

  const templates = (data ?? []) as EmailTemplate[];

  const openEdit = (t: EmailTemplate) => { setEditing(t); setForm({ subject: t.subject, body: t.body }); };

  return (
    <AdminPageShell title="Email Templates">
      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <div className="space-y-2">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm capitalize">{t.name.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{t.subject}</p>
                  {t.variables?.length > 0 && <p className="text-xs text-muted-foreground mt-1">Variables: {t.variables.join(", ")}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit: {editing?.name?.replace(/_/g, " ")}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Body (HTML)</Label>
              {editing?.variables && editing.variables.length > 0 && <p className="text-xs text-muted-foreground">Available: {editing.variables.map((v) => `{{${v}}}`).join(", ")}</p>}
              <textarea className="w-full min-h-[250px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
