"use client";

import { useState, useEffect } from "react";
import { usersApi } from "@jungle/api-client";
import type { Address } from "@jungle/api-client";
import {
  Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge,
  ConfirmDialog,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@jungle/ui";
import { Plus, Pencil, Trash2, MapPin, Star } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = {
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

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Address | null>(null);

  const load = () => {
    setLoading(true);
    usersApi.getAddresses()
      .then(setAddresses)
      .catch(() => toast.error("Failed to load addresses"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (addr: Address) => {
    setEditing(addr);
    setForm({
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

  const handleSave = async () => {
    if (!form.name || !form.line1 || !form.city || !form.country) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const updated = await usersApi.updateAddress(editing.id, form);
        setAddresses((prev) => prev.map((a) => a.id === editing.id ? updated : a));
      } else {
        const created = await usersApi.createAddress(form);
        setAddresses((prev) => [...prev, created]);
      }
      toast.success(editing ? "Address updated" : "Address added");
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save address");
    } finally {
      setSaving(false);
    }
  };

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
      const updated = await usersApi.updateAddress(addr.id, { is_default: true });
      setAddresses((prev) => prev.map((a) => ({
        ...a,
        is_default: a.id === addr.id ? updated.is_default : false,
      })));
      toast.success("Default address updated");
    } catch {
      toast.error("Failed to update default");
    }
  };

  const field = (key: keyof typeof form) => (
    <div key={key} className="space-y-1">
      <Label htmlFor={key} className="capitalize text-sm">
        {key.replace("_", " ")}{["name", "line1", "city", "country"].includes(key) && " *"}
      </Label>
      {key === "is_default" ? null : (
        <Input
          id={key}
          value={form[key] as string}
          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          placeholder={key === "line1" ? "Street address" : undefined}
        />
      )}
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
          <Plus className="h-4 w-4 mr-1" /> Add Address
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground">No saved addresses yet.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> Add your first address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {addresses.map((addr) => (
            <Card key={addr.id} className={addr.is_default ? "border-primary/50" : ""}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {addr.name}
                  {addr.is_default && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
                </CardTitle>
                <div className="flex gap-1">
                  {!addr.is_default && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Set as default" onClick={() => handleSetDefault(addr)}>
                      <Star className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(addr)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setPendingDelete(addr)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-0.5">
                <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                <p>{addr.country}</p>
                {addr.phone && <p>{addr.phone}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Address" : "Add Address"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(["name", "line1", "line2", "city", "state", "country", "postal_code", "phone"] as (keyof typeof form)[]).map(field)}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={form.is_default}
                onChange={(e) => setForm((p) => ({ ...p, is_default: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="is_default" className="text-sm cursor-pointer">Set as default address</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Update" : "Add Address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        title="Delete this address?"
        description={pendingDelete ? `"${pendingDelete.name}" will be removed from your saved addresses.` : undefined}
        variant="destructive"
        confirmText="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
