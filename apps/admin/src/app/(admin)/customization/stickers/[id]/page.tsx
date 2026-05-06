"use client";
import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, mediaApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Card, CardContent, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import Image from "next/image";

interface Sticker {
  id: number;
  pack_id: number;
  image_url: string;
  sort_order?: number;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function StickerPackEditPage({ params }: Props) {
  const { id } = use(params);
  const packId = Number(id);
  const router = useRouter();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stickers", packId],
    queryFn: () => adminApi.getStickerPackStickers(packId),
  });

  const stickers = ((data ?? []) as { data?: Sticker[] } & Sticker[])?.data ??
    (data as Sticker[]) ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "stickers", packId] });

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setProgress({ done: 0, total: files.length });
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData();
        fd.append("file", files[i]);
        const m = await mediaApi.uploadMedia(fd);
        urls.push(m.url);
        setProgress({ done: i + 1, total: files.length });
      }
      await adminApi.bulkAddStickers(packId, urls);
      toast.success(`Added ${urls.length} sticker${urls.length === 1 ? "" : "s"}`);
      invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload stickers");
    } finally {
      setUploading(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteSticker(id),
    onSuccess: () => {
      toast.success("Sticker removed");
      invalidate();
    },
  });

  return (
    <AdminPageShell
      title="Manage Stickers"
      description={`Pack #${packId}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/customization/stickers")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-1" />
            {uploading
              ? `Uploading ${progress.done}/${progress.total}…`
              : "Upload stickers"}
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {stickers.map((s: Sticker) => (
            <Card key={s.id} className="group relative overflow-hidden">
              <div className="relative aspect-square bg-secondary/40">
                {s.image_url && (
                  <Image
                    src={s.image_url}
                    alt={`Sticker ${s.id}`}
                    fill
                    className="object-contain p-2"
                  />
                )}
              </div>
              <CardContent className="p-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => deleteMutation.mutate(s.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {stickers.length === 0 && (
            <p className="col-span-full text-muted-foreground text-sm font-bold uppercase tracking-wide">
              No stickers yet. Upload images above to add them in bulk.
            </p>
          )}
        </div>
      )}
    </AdminPageShell>
  );
}
