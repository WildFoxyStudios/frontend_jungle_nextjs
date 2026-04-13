"use client";
import { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Card, CardContent, Skeleton, Badge } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import Image from "next/image";

interface StickerPack { id: number; name: string; cover: string; sticker_count: number; is_free: boolean }

export default function StickersPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin", "sticker-packs"], queryFn: () => adminApi.getStickerPacks() });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("cover", file);
      fd.append("name", file.name.replace(/\.\w+$/, ""));
      return adminApi.createStickerPack(fd);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "sticker-packs"] }); toast.success("Sticker pack created"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteStickerPack(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "sticker-packs"] }); toast.success("Deleted"); },
  });

  const packs = (data ?? []) as StickerPack[];

  return (
    <AdminPageShell title="Sticker Packs" actions={
      <>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadMutation.mutate(f); e.target.value = ""; }} />
        <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending}>
          <Plus className="h-4 w-4 mr-1" /> Add Pack
        </Button>
      </>
    }>
      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {packs.map((pack) => (
            <Card key={pack.id} className="group relative overflow-hidden">
              <div className="relative aspect-square bg-muted">
                {pack.cover && <Image src={pack.cover} alt={pack.name} fill className="object-cover" />}
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{pack.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant={pack.is_free ? "secondary" : "default"}>{pack.is_free ? "Free" : "Paid"}</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(pack.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {packs.length === 0 && <p className="col-span-full text-muted-foreground text-sm">No sticker packs yet.</p>}
        </div>
      )}
    </AdminPageShell>
  );
}
