"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Button, Input, Badge, Skeleton,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Label,
} from "@jungle/ui";
import { toast } from "sonner";
import { Search, Pencil } from "lucide-react";

interface CountryRow {
  id: number;
  name: string;
  iso_code: string;
  iso3_code: string | null;
  phone_code: string | null;
  flag_emoji: string | null;
  currency_code: string | null;
  is_active: boolean;
  sort_order: number;
}

export default function CountriesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CountryRow | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone_code: "", flag_emoji: "", currency_code: "", sort_order: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "countries", search],
    queryFn: () => adminApi.getCountries(search ? { q: search } : undefined),
  });

  const rows = ((data as { data?: CountryRow[] })?.data ?? []) as CountryRow[];

  const openEdit = (c: CountryRow) => {
    setEditing(c);
    setForm({
      name: c.name, phone_code: c.phone_code ?? "",
      flag_emoji: c.flag_emoji ?? "", currency_code: c.currency_code ?? "",
      sort_order: c.sort_order,
    });
    setOpen(true);
  };

  const updateMut = useMutation({
    mutationFn: () => editing ? adminApi.updateCountry(editing.id, form) : Promise.resolve(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "countries"] }); setOpen(false); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = async (c: CountryRow) => {
    await adminApi.updateCountry(c.id, { is_active: !c.is_active });
    qc.invalidateQueries({ queryKey: ["admin", "countries"] });
  };

  return (
    <AdminPageShell title="Countries">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search countries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? <Skeleton className="h-96 w-full" /> : (
        <div className="border bg-card divide-y shadow-sm max-h-[70vh] overflow-y-auto">
          {rows.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm font-bold uppercase tracking-wide">No countries found.</p>
          )}
          {rows.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg shrink-0">{c.flag_emoji ?? "🏳"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {c.iso_code}{c.iso3_code ? ` / ${c.iso3_code}` : ""} | {c.phone_code ?? "—"} | {c.currency_code ?? "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={c.is_active ? "default" : "secondary"} className="text-[10px]">
                  {c.is_active ? "Active" : "Inactive"}
                </Badge>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toggleActive(c)}>
                  {c.is_active ? "Disable" : "Enable"}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Country — {editing?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Phone Code</Label>
              <Input value={form.phone_code} onChange={(e) => setForm((f) => ({ ...f, phone_code: e.target.value }))} placeholder="+1" />
            </div>
            <div className="space-y-1">
              <Label>Flag Emoji</Label>
              <Input value={form.flag_emoji} onChange={(e) => setForm((f) => ({ ...f, flag_emoji: e.target.value }))} placeholder="🇺🇸" />
            </div>
            <div className="space-y-1">
              <Label>Currency Code</Label>
              <Input value={form.currency_code} onChange={(e) => setForm((f) => ({ ...f, currency_code: e.target.value }))} placeholder="USD" />
            </div>
            <div className="space-y-1">
              <Label>Sort Order</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => updateMut.mutate()} disabled={updateMut.isPending}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
