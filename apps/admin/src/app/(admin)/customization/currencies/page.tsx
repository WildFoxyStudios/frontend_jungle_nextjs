"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Input, Badge, Card, CardContent, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Label } from "@jungle/ui";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Currency { id: number; code: string; name: string; symbol: string; is_active: boolean }

export default function CurrenciesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", symbol: "" });

  const { data, isLoading } = useQuery({ queryKey: ["admin", "currencies"], queryFn: () => adminApi.getCurrencies() });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createCurrency(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "currencies"] }); setOpen(false); setForm({ code: "", name: "", symbol: "" }); toast.success("Currency added"); },
  });

  const currencies = (data ?? []) as Currency[];

  return (
    <AdminPageShell title="Currencies" actions={
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Currency</Button>
    }>
      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <div className="border rounded-lg divide-y">
          {currencies.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No currencies yet.</p>}
          {currencies.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-sm w-12">{c.code}</span>
                <span className="text-sm">{c.name}</span>
                <span className="text-muted-foreground text-sm">{c.symbol}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                <Button variant="outline" size="sm" onClick={async () => { await adminApi.toggleCurrency(c.id); qc.invalidateQueries({ queryKey: ["admin", "currencies"] }); }}>
                  {c.is_active ? "Disable" : "Enable"}
                </Button>
                <Button variant="destructive" size="sm" onClick={async () => { await adminApi.deleteCurrency(c.id); qc.invalidateQueries({ queryKey: ["admin", "currencies"] }); toast.success("Deleted"); }}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Currency</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {(["code", "name", "symbol"] as const).map((field) => (
              <div key={field} className="space-y-1">
                <Label className="capitalize">{field}</Label>
                <Input value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} placeholder={field === "code" ? "USD" : field === "name" ? "US Dollar" : "$"} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.code || !form.name || createMutation.isPending}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
