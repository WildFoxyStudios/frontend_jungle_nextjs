"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { productsApi } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@jungle/ui";
import { useMediaUpload } from "@jungle/hooks";
import { toast } from "sonner";

export default function CreateProductPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploadImage, isUploading } = useMediaUpload();
  const [form, setForm] = useState({ name: "", description: "", price: "", currency: "USD", category: "", location: "" });
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const media = await uploadImage(file, "product");
    if (media) setImageUrl(media.url); e.target.value = "";
  };
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(form.price);
    if (!form.name.trim() || isNaN(price)) return;
    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name); fd.append("description", form.description);
      fd.append("price", String(price)); fd.append("currency", form.currency);
      fd.append("category", form.category);
      if (form.location) fd.append("location", form.location);
      if (imageUrl) fd.append("image_url", imageUrl);
      const product = await productsApi.createProduct(fd);
      router.push("/marketplace/" + product.id);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setIsLoading(false); }
  };
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card><CardHeader><CardTitle>Create Listing</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1"><Label>Title</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} /></div>
            <div className="space-y-1">
              <Label>Photo</Label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={isUploading}>
                {imageUrl ? "Change photo" : "Add photo"}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Price</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} /></div>
              <div className="space-y-1"><Label>Currency</Label><Input value={form.currency} onChange={(e) => update("currency", e.target.value)} /></div>
            </div>
            <div className="space-y-1"><Label>Category</Label><Input value={form.category} onChange={(e) => update("category", e.target.value)} /></div>
            <div className="space-y-1"><Label>Location</Label><Input value={form.location} onChange={(e) => update("location", e.target.value)} /></div>
            <Button type="submit" disabled={isLoading || !form.name.trim() || !form.price} className="w-full">{isLoading ? "Creating..." : "Create listing"}</Button>
          </form>
        </CardContent></Card>
    </div>
  );
}