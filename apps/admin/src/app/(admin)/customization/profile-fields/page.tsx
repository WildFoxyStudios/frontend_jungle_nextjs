"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Input, Label, Badge, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface ProfileField { id: number; name: string; field_type: string; required: boolean; active: boolean }

export default function ProfileFieldsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", field_type: "text", required: false });

  const { data, isLoading } = useQuery({ queryKey: ["admin", "profile-fields"], queryFn: () => adminApi.getProfileFields() });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createProfileField(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "profile-fields"] }); setOpen(false); setForm({ name: "", field_type: "text", required: false }); toast.success("Field created"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteProfileField(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "profile-fields"] }); toast.success("Deleted"); },
  });

  const fields = (data ?? []) as ProfileField[];

  return (
    <AdminPageShell title="Profile Fields" description="Custom fields shown on user profiles" actions={
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Field</Button>
    }>
      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <div className="border rounded-lg divide-y">
          {fields.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No custom fields yet.</p>}
          {fields.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{f.name}</span>
                <Badge variant="secondary">{f.field_type}</Badge>
                {f.required && <Badge variant="outline">Required</Badge>}
                {!f.active && <Badge variant="secondary">Inactive</Badge>}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(f.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Profile Field</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Field Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Website" /></div>
            <div className="space-y-1">
              <Label>Field Type</Label>
              <Select value={form.field_type} onValueChange={(v) => setForm((f) => ({ ...f, field_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["text", "url", "email", "phone", "date", "select", "textarea"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="required" checked={form.required} onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))} className="h-4 w-4" />
              <Label htmlFor="required">Required field</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
