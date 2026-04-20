"use client";

import { use, useEffect, useRef, useState } from "react";
import { pagesApi } from "@jungle/api-client";
import type { Page } from "@jungle/api-client";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@jungle/ui";
import { toast } from "sonner";
import { Upload, Image as ImageIcon } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

export default function PageAvatarPage({ params }: Props) {
  const { slug } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    pagesApi.getPage(slug)
      .then(setPage)
      .catch(() => toast.error("Failed to load page"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !page) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await pagesApi.uploadPageAvatar(page.id, fd);
      setPage((prev) => prev ? { ...prev, avatar: res.avatar } : prev);
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !page) return;
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await pagesApi.uploadPageCover(page.id, fd);
      setPage((prev) => prev ? { ...prev, cover: res.cover } : prev);
      toast.success("Cover photo updated");
    } catch {
      toast.error("Failed to upload cover");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!page) return <p className="text-muted-foreground">Page not found.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Page Avatar</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={page.avatar} />
              <AvatarFallback className="text-2xl">{page.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Recommended: 200×200px. JPG, PNG or GIF.
              </p>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <Button variant="outline" disabled={uploadingAvatar} onClick={() => avatarInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                {uploadingAvatar ? "Uploading…" : "Upload avatar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cover Photo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-[3/1] rounded-lg overflow-hidden bg-muted">
            {page.cover ? (
              <img src={page.cover} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Recommended: 1280×480px. JPG or PNG.
          </p>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          <Button variant="outline" disabled={uploadingCover} onClick={() => coverInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            {uploadingCover ? "Uploading…" : "Upload cover photo"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
