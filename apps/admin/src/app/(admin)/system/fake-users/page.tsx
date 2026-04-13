"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Card, CardContent, Input, Label, Avatar, AvatarFallback, AvatarImage, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@jungle/ui";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface FakeUser { id: number; username: string; first_name: string; last_name: string; avatar: string; created_at: string }

export default function FakeUsersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", username: "", email: "" });

  const { data, isLoading } = useQuery({ queryKey: ["admin", "fake-users"], queryFn: () => adminApi.getFakeUsers() });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createFakeUser(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "fake-users"] }); setOpen(false); setForm({ first_name: "", last_name: "", username: "", email: "" }); toast.success("Fake user created"); },
    onError: () => toast.error("Failed"),
  });

  const users = (data ?? []) as FakeUser[];

  return (
    <AdminPageShell title="Fake Users" description="Create test accounts for demonstration purposes" actions={
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Create Fake User</Button>
    }>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {users.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No fake users yet.</p>}
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={u.avatar} />
                <AvatarFallback>{u.first_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{u.first_name} {u.last_name}</p>
                <p className="text-xs text-muted-foreground">@{u.username}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Fake User</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {(["first_name", "last_name", "username", "email"] as const).map((field) => (
              <div key={field} className="space-y-1">
                <Label className="capitalize">{field.replace("_", " ")}</Label>
                <Input value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.username || !form.email || createMutation.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
