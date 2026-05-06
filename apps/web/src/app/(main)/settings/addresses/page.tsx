"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usersApi } from "@jungle/api-client";
import type { Address } from "@jungle/api-client";
import {
 Card,
 CardContent,
 CardHeader,
 CardTitle,
 Button,
 Input,
 Label,
 Badge,
 ConfirmDialog,
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogFooter,
} from "@jungle/ui";
import { Plus, Pencil, Trash2, MapPin, Star } from "lucide-react";
import { toast } from "sonner";

const addressSchema = z.object({
 name: z.string().min(1, "Required").max(120),
 line1: z.string().min(1, "Required").max(240),
 line2: z.string().max(240).optional(),
 city: z.string().min(1, "Required").max(120),
 state: z.string().max(120).optional(),
 country: z.string().min(1, "Required").max(120),
 postal_code: z.string().max(32).optional(),
 phone: z.string().max(40).optional(),
 is_default: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

const EMPTY_FORM: AddressFormValues = {
 name: "",
 line1: "",
 line2: "",
 city: "",
 state: "",
 country: "",
 postal_code: "",
 phone: "",
 is_default: false,
};

function toAddressPayload(data: AddressFormValues): Omit<Address, "id"> {
 return {
 name: data.name,
 line1: data.line1,
 line2: data.line2?.trim() ? data.line2 : undefined,
 city: data.city,
 state: data.state ?? "",
 country: data.country,
 postal_code: data.postal_code ?? "",
 phone: data.phone ?? "",
 is_default: data.is_default,
 };
}

export default function AddressesPage() {
 const [addresses, setAddresses] = useState<Address[]>([]);
 const [loading, setLoading] = useState(true);
 const [dialogOpen, setDialogOpen] = useState(false);
 const [editing, setEditing] = useState<Address | null>(null);
 const [pendingDelete, setPendingDelete] = useState<Address | null>(null);

 const {
 register,
 handleSubmit,
 reset,
 formState: { errors, isSubmitting },
 } = useForm<AddressFormValues>({
 resolver: zodResolver(addressSchema),
 defaultValues: EMPTY_FORM,
 });

 const load = () => {
 setLoading(true);
 usersApi
 .getAddresses()
 .then(setAddresses)
 .catch(() => toast.error("Failed to load addresses"))
 .finally(() => setLoading(false));
 };

 useEffect(() => {
 load();
 }, []);

 const openCreate = () => {
 setEditing(null);
 reset(EMPTY_FORM);
 setDialogOpen(true);
 };

 const openEdit = (addr: Address) => {
 setEditing(addr);
 reset({
 name: addr.name,
 line1: addr.line1,
 line2: addr.line2 ?? "",
 city: addr.city,
 state: addr.state,
 country: addr.country,
 postal_code: addr.postal_code,
 phone: addr.phone,
 is_default: addr.is_default,
 });
 setDialogOpen(true);
 };

 const onSave = handleSubmit(async (data) => {
 const payload = toAddressPayload(data);
 try {
 if (editing) {
 const updated = await usersApi.updateAddress(editing.id, payload);
 setAddresses((prev) => prev.map((a) => (a.id === editing.id ? updated : a)));
 } else {
 const created = await usersApi.createAddress(payload);
 setAddresses((prev) => [...prev, created]);
 }
 toast.success(editing ? "Address updated" : "Address added");
 setDialogOpen(false);
 } catch {
 toast.error("Failed to save address");
 }
 });

 const confirmDelete = async () => {
 if (!pendingDelete) return;
 const id = pendingDelete.id;
 try {
 await usersApi.deleteAddress(id);
 setAddresses((prev) => prev.filter((a) => a.id !== id));
 toast.success("Address deleted");
 } catch {
 toast.error("Failed to delete address");
 }
 };

 const handleSetDefault = async (addr: Address) => {
 try {
 const { id, ...rest } = addr;
 const updated = await usersApi.updateAddress(id, { ...rest, is_default: true });
 setAddresses((prev) =>
 prev.map((a) => ({
 ...a,
 is_default: a.id === addr.id ? updated.is_default : false,
 })),
 );
 toast.success("Default address updated");
 } catch {
 toast.error("Failed to update default");
 }
 };

 const textField = (key: keyof Pick<AddressFormValues, Exclude<keyof AddressFormValues, "is_default">>, label: string, required?: boolean) => (
 <div key={key} className="space-y-1">
 <Label htmlFor={key} className="text-sm">
 {label}
 {required ? " *" : ""}
 </Label>
 <Input id={key} {...register(key)} placeholder={key === "line1" ? "Street address" : undefined} />
 {errors[key] && <p className="text-xs text-destructive">{errors[key]?.message}</p>}
 </div>
 );

 return (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-xl font-bold">Shipping Addresses</h1>
 <p className="text-sm text-muted-foreground">Manage your saved addresses for marketplace orders</p>
 </div>
 <Button onClick={openCreate} size="sm">
 <Plus className="mr-1 h-4 w-4" /> Add Address
 </Button>
 </div>

 {loading ? (
 <div className="text-sm text-muted-foreground">Loading…</div>
 ) : addresses.length === 0 ? (
 <Card>
 <CardContent className="py-12 text-center">
 <MapPin className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
 <p className="text-muted-foreground">No saved addresses yet.</p>
 <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>
 <Plus className="mr-1 h-4 w-4" /> Add your first address
 </Button>
 </CardContent>
 </Card>
 ) : (
 <div className="grid gap-3">
 {addresses.map((addr) => (
 <Card key={addr.id} className={addr.is_default ? "border-primary/50" : ""}>
 <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
 <CardTitle className="flex items-center gap-2 text-sm font-medium">
 {addr.name}
 {addr.is_default && (
 <Badge variant="secondary" className="text-[10px]">
 Default
 </Badge>
 )}
 </CardTitle>
 <div className="flex gap-1">
 {!addr.is_default && (
 <Button
 variant="ghost"
 size="icon"
 className="h-7 w-7"
 title="Set as default"
 onClick={() => handleSetDefault(addr)}
 >
 <Star className="h-3.5 w-3.5" />
 </Button>
 )}
 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(addr)}>
 <Pencil className="h-3.5 w-3.5" />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 className="h-7 w-7 text-destructive hover:text-destructive"
 onClick={() => setPendingDelete(addr)}
 >
 <Trash2 className="h-3.5 w-3.5" />
 </Button>
 </div>
 </CardHeader>
 <CardContent className="space-y-0.5 text-sm text-muted-foreground">
 <p>
 {addr.line1}
 {addr.line2 ? `, ${addr.line2}` : ""}
 </p>
 <p>
 {addr.city}, {addr.state} {addr.postal_code}
 </p>
 <p>{addr.country}</p>
 {addr.phone && <p>{addr.phone}</p>}
 </CardContent>
 </Card>
 ))}
 </div>
 )}

 <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
 <DialogContent className="max-w-md">
 <form onSubmit={onSave}>
 <DialogHeader>
 <DialogTitle>{editing ? "Edit Address" : "Add Address"}</DialogTitle>
 </DialogHeader>
 <div className="space-y-3 py-2">
 {textField("name", "Label", true)}
 {textField("line1", "Line 1", true)}
 {textField("line2", "Line 2")}
 {textField("city", "City", true)}
 {textField("state", "State / region")}
 {textField("country", "Country", true)}
 {textField("postal_code", "Postal code")}
 {textField("phone", "Phone")}
 <div className="flex items-center gap-2">
 <input type="checkbox" id="is_default" className="rounded" {...register("is_default")} />
 <Label htmlFor="is_default" className="cursor-pointer text-sm">
 Set as default address
 </Label>
 </div>
 </div>
 <DialogFooter>
 <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
 Cancel
 </Button>
 <Button type="submit" disabled={isSubmitting}>
 {isSubmitting ? "Saving…" : editing ? "Update" : "Add Address"}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>

 <ConfirmDialog
 open={pendingDelete !== null}
 onOpenChange={(o) => {
 if (!o) setPendingDelete(null);
 }}
 title="Delete this address?"
 description={pendingDelete ? `"${pendingDelete.name}" will be removed from your saved addresses.` : undefined}
 variant="destructive"
 confirmText="Delete"
 onConfirm={confirmDelete}
 />
 </div>
 );
}
