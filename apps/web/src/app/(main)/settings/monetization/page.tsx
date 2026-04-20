"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { paymentsApi } from "@jungle/api-client";
import type { CreatorTier } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Textarea, Skeleton, Badge } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const tierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0.5, "Minimum price is $0.50"),
  currency: z.string().default("USD"),
});

type TierForm = z.infer<typeof tierSchema>;

export default function MonetizationSettingsPage() {
  const { user } = useAuthStore();
  const [tiers, setTiers] = useState<CreatorTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TierForm>({
    resolver: zodResolver(tierSchema),
    defaultValues: { currency: "USD" },
  });

  useEffect(() => {
    if (!user) return;
    paymentsApi.getCreatorTiers(user.id)
      .then(setTiers)
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, [user]);

  const onSubmit = async (data: TierForm) => {
    try {
      const created = await paymentsApi.createCreatorTier(data);
      setTiers((prev) => [...prev, created]);
      reset();
      setShowForm(false);
      toast.success("Tier created");
    } catch {
      toast.error("Failed to create tier");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await paymentsApi.deleteCreatorTier(id);
      setTiers((prev) => prev.filter((t) => t.id !== id));
      toast.success("Tier deleted");
    } catch {
      toast.error("Failed to delete tier");
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Creator Tiers</h2>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> Add Tier
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Tier</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Tier Name</Label>
                <Input {...register("name")} placeholder="e.g. Supporter" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea {...register("description")} placeholder="What do subscribers get?" rows={2} />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Monthly Price</Label>
                  <Input type="number" step="0.01" {...register("price")} />
                  {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Input {...register("currency")} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create Tier"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {tiers.length === 0 && !showForm && (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No tiers yet. Create your first tier to start monetizing.</CardContent></Card>
      )}

      {tiers.map((tier) => (
        <Card key={tier.id}>
          <CardContent className="p-4 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{tier.name}</p>
                <Badge variant="secondary">{tier.currency} {tier.price}/mo</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{tier.description}</p>
              <p className="text-xs text-muted-foreground">{tier.subscriber_count} subscribers</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleDelete(tier.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
