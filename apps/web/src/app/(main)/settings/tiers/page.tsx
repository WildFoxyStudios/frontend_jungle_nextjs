"use client";

import { useEffect, useState } from "react";
import { paymentsApi } from "@jungle/api-client";
import type { CreatorTier } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Badge } from "@jungle/ui";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@jungle/hooks";

export default function CreatorTiersPage() {
  const { user } = useAuthStore();
  const [tiers, setTiers] = useState<CreatorTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", currency: "USD" });
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTiers = async () => {
    if (!user) return;
    try {
      const res = await paymentsApi.getCreatorTiers(user.id);
      setTiers(res);
    } catch { /* empty state */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadTiers(); }, [user]);

  const handleSave = async () => {
    const price = parseFloat(form.price);
    if (!form.name.trim() || isNaN(price) || price <= 0) {
      toast.error("Fill in all required fields"); return;
    }
    setIsSubmitting(true);
    try {
      if (editingId) {
        await paymentsApi.updateCreatorTier(editingId, { name: form.name, description: form.description, price });
        toast.success("Tier updated");
      } else {
        await paymentsApi.createCreatorTier({ name: form.name, description: form.description, price, currency: form.currency });
        toast.success("Tier created");
      }
      setForm({ name: "", description: "", price: "", currency: "USD" });
      setIsAdding(false); setEditingId(null);
      void loadTiers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save tier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await paymentsApi.deleteCreatorTier(id);
      setTiers((t) => t.filter((x) => x.id !== id));
      toast.success("Tier deleted");
    } catch {
      toast.error("Failed to delete tier");
    }
  };

  const startEdit = (tier: CreatorTier) => {
    setEditingId(tier.id);
    setForm({ name: tier.name, description: tier.description, price: String(tier.price), currency: tier.currency });
    setIsAdding(true);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Creator Tiers</h1>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add tier
          </Button>
        )}
      </div>

      {isAdding && (
        <Card>
          <CardHeader><CardTitle>{editingId ? "Edit tier" : "New tier"}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1"><Label>Tier name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Price / month *</Label><Input type="number" min="0.99" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save tier"}</Button>
              <Button variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); setForm({ name: "", description: "", price: "", currency: "USD" }); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : tiers.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground text-sm">No tiers yet. Create your first tier to start accepting subscribers.</CardContent></Card>
        ) : tiers.map((tier) => (
          <Card key={tier.id}>
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{tier.name}</p>
                  <Badge variant="secondary">{tier.currency} {tier.price}/mo</Badge>
                  <Badge variant="outline">{tier.subscriber_count} subscribers</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{tier.description}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => startEdit(tier)}><Edit2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(tier.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}