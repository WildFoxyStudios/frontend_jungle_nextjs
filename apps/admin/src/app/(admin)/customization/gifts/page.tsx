"use client";
import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Card, CardContent, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface Gift { id: number; name: string; media_file: string; created_at: string }

export default function GiftsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "gifts"], queryFn: () => adminApi.getGifts() });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("media_file", file);
      fd.append("name", file.name.replace(/\.\w+$/, ""));
      return adminApi.createGift(fd);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "gifts"] }); toast.success("Gift added"); },
    onError: () => toast.error("Upload failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteGift(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "gifts"] }); toast.success("Deleted"); },
  });

  const gifts = (data ?? []) as Gift[];

  return (
    <AdminPageShell title="Gifts" actions={
      <>
        <input ref={fileRef} type="file" accept="image/*,video/*,image/gif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMutation.mutate(f); e.target.value = ""; }} />
        <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending}>
          <Plus className="h-4 w-4 mr-1" /> Add Gift
        </Button>
      </>
    }>
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {gifts.map((gift) => (
            <Card key={gift.id} className="overflow-hidden group relative">
              <CardContent className="p-2 text-center">
                <div className="relative aspect-square mb-1">
                  <Image src={gift.media_file} alt={gift.name} fill className="object-contain" />
                </div>
                <p className="text-xs truncate">{gift.name}</p>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteMutation.mutate(gift.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {gifts.length === 0 && <p className="col-span-full text-muted-foreground text-sm">No gifts yet.</p>}
        </div>
      )}
    </AdminPageShell>
  );
}
