"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Button, Input, Badge, Skeleton,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Label,
  Tabs, TabsList, TabsTrigger,
} from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";

interface LookupRow {
  id: number;
  lookup_type: string;
  value: string;
  label_key: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const LOOKUP_TABS = [
  { key: "job_type", label: "Job Types" },
  { key: "experience", label: "Experience Levels" },
  { key: "salary_period", label: "Salary Periods" },
  { key: "benefit", label: "Benefits" },
  { key: "condition", label: "Conditions" },
  { key: "report_reason", label: "Report Reasons" },
] as const;

export default function LookupsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("job_type");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LookupRow | null>(null);
  const [form, setForm] = useState({ value: "", label_key: "", icon: "", sort_order: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "lookups", activeTab],
    queryFn: () => adminApi.getLookups(activeTab),
  });

  const rows = ((data as { data?: LookupRow[] })?.data ?? []) as LookupRow[];

  const resetForm = () => {
    setForm({ value: "", label_key: "", icon: "", sort_order: 0 });
    setEditing(null);
  };

  const openCreate = () => { resetForm(); setOpen(true); };
  const openEdit = (r: LookupRow) => {
    setEditing(r);
    setForm({ value: r.value, label_key: r.label_key, icon: r.icon ?? "", sort_order: r.sort_order });
    setOpen(true);
  };

  const createMut = useMutation({
    mutationFn: () => adminApi.createLookup({ ...form, lookup_type: activeTab, icon: form.icon || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "lookups", activeTab] }); setOpen(false); resetForm(); toast.success("Created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: () => editing ? adminApi.updateLookup(editing.id, { ...form, icon: form.icon || undefined }) : Promise.resolve(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "lookups", activeTab] }); setOpen(false); resetForm(); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminApi.deleteLookup(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "lookups", activeTab] }); toast.success("Deleted"); },
  });

  const toggleActive = async (r: LookupRow) => {
    await adminApi.updateLookup(r.id, { is_active: !r.is_active });
    qc.invalidateQueries({ queryKey: ["admin", "lookups", activeTab] });
  };

  return (
    <AdminPageShell title="Lookups" actions={
      <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add</Button>
    }>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          {LOOKUP_TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="text-xs">{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <div className="border bg-card divide-y shadow-sm">
          {rows.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm font-bold uppercase tracking-wide">No entries.</p>
          )}
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono font-bold text-sm shrink-0">{r.value}</span>
                <span className="text-xs text-muted-foreground truncate">{r.label_key}</span>
                {r.icon && <Badge variant="outline" className="text-[10px] shrink-0">{r.icon}</Badge>}
                <span className="text-[10px] text-muted-foreground shrink-0">sort: {r.sort_order}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={r.is_active ? "default" : "secondary"} className="text-[10px]">
                  {r.is_active ? "Active" : "Inactive"}
                </Badge>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toggleActive(r)}>
                  {r.is_active ? "Disable" : "Enable"}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => deleteMut.mutate(r.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Lookup — {activeTab}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Value</Label>
              <Input value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="full_time" />
            </div>
            <div className="space-y-1">
              <Label>Label Key (i18n)</Label>
              <Input value={form.label_key} onChange={(e) => setForm((f) => ({ ...f, label_key: e.target.value }))} placeholder="jobs.types.fullTime" />
            </div>
            <div className="space-y-1">
              <Label>Icon (Lucide name)</Label>
              <Input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} placeholder="briefcase" />
            </div>
            <div className="space-y-1">
              <Label>Sort Order</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => editing ? updateMut.mutate() : createMut.mutate()} disabled={!form.value || !form.label_key || createMut.isPending || updateMut.isPending}>
              {editing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
