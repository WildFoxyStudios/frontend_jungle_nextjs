"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usersApi } from "@jungle/api-client";
import type { Address } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Badge } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const addressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postal_code: z.string().min(1, "Postal code is required"),
  phone: z.string().min(1, "Phone is required"),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    usersApi.getAddresses()
      .then(setAddresses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setEditing(null); reset({}); setOpen(true); };
  const openEdit = (addr: Address) => { setEditing(addr); reset(addr); setOpen(true); };

  const onSubmit = async (data: AddressForm) => {
    try {
      if (editing) {
        const updated = await usersApi.updateAddress(editing.id, data);
        setAddresses((prev) => prev.map((a) => a.id === editing.id ? updated : a));
        toast.success("Address updated");
      } else {
        const created = await usersApi.createAddress(data);
        setAddresses((prev) => [...prev, created]);
        toast.success("Address added");
      }
      setOpen(false);
    } catch {
      toast.error("Failed to save address");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await usersApi.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Address deleted");
    } catch {
      toast.error("Failed to delete address");
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Shipping Addresses</h2>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Address</Button>
      </div>

      {addresses.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No addresses saved yet.</CardContent></Card>
      )}

      {addresses.map((addr) => (
        <Card key={addr.id}>
          <CardContent className="p-4 flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{addr.name}</p>
                {addr.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
              <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.postal_code}</p>
              <p className="text-sm text-muted-foreground">{addr.country} · {addr.phone}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(addr)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(addr.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Address" : "New Address"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 py-2">
            {(["name", "line1", "line2", "city", "state", "country", "postal_code", "phone"] as const).map((field) => (
              <div key={field} className="space-y-1">
                <Label className="capitalize">{field.replace("_", " ")}</Label>
                <Input {...register(field)} />
                {errors[field] && <p className="text-xs text-destructive">{errors[field]?.message}</p>}
              </div>
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{editing ? "Save" : "Add"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
