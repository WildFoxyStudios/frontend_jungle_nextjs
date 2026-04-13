"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Input, Card, CardContent, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface Gender { id: number; name: string }

export default function GendersPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin", "genders"], queryFn: () => adminApi.getGenders() });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createGender({ name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "genders"] }); setName(""); toast.success("Gender added"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteGender(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "genders"] }); toast.success("Deleted"); },
  });

  const genders = (data ?? []) as Gender[];

  return (
    <AdminPageShell title="Genders">
      <div className="flex gap-2 max-w-sm">
        <Input placeholder="Gender name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim() && createMutation.mutate()} />
        <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending}><Plus className="h-4 w-4" /></Button>
      </div>
      {isLoading ? <Skeleton className="h-32 w-full mt-4" /> : (
        <div className="border rounded-lg divide-y mt-4">
          {genders.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No genders configured.</p>}
          {genders.map((g) => (
            <div key={g.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium">{g.name}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(g.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
