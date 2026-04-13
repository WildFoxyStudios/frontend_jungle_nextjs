"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { productsApi } from "@jungle/api-client";
import type { Product } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Skeleton } from "@jungle/ui";
import { toast } from "sonner";

interface Props { params: Promise<{ id: string }> }

export default function EditProductPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ title: "", description: "", price: "", currency: "USD", category: "", location: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    productsApi.getProduct(Number(id)).then((p) => {
      setProduct(p);
      setForm({ title: p.title, description: p.description, price: String(p.price), currency: p.currency, category: p.category, location: p.location });
    }).catch(() => toast.error("Failed to load product"))
    .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    const price = parseFloat(form.price);
    if (!form.title.trim() || isNaN(price)) { toast.error("Fill in required fields"); return; }
    setSaving(true);
    try {
      await productsApi.updateProduct(Number(id), { title: form.title, description: form.description, price, currency: form.currency, category: form.category, location: form.location } as Partial<Product>);
      toast.success("Product updated");
      router.push("/marketplace/" + id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update product");
    } finally { setSaving(false); }
  };

  if (loading) return <Skeleton className="h-64 w-full max-w-2xl mx-auto mt-4" />;
  if (!product) return <p className="text-center mt-8 text-muted-foreground">Product not found.</p>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader><CardTitle>Edit Listing</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={(e) => update("title", e.target.value)} /></div>
          <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label>Price</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} /></div>
            <div className="space-y-1"><Label>Currency</Label><Input value={form.currency} onChange={(e) => update("currency", e.target.value)} /></div>
          </div>
          <div className="space-y-1"><Label>Category</Label><Input value={form.category} onChange={(e) => update("category", e.target.value)} /></div>
          <div className="space-y-1"><Label>Location</Label><Input value={form.location} onChange={(e) => update("location", e.target.value)} /></div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
            <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}