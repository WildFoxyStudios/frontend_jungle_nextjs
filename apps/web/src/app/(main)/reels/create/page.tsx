"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { mediaApi } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Textarea, Progress } from "@jungle/ui";
import { Film, Upload, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function CreateReelPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) { toast.error("Please select a video file"); return; }
    if (f.size > 100 * 1024 * 1024) { toast.error("Video must be under 100 MB"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) { toast.error("Select a video first"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("video", file);
      fd.append("caption", caption);
      await mediaApi.createReel(fd, setProgress);
      toast.success("Reel published!");
      router.push("/reels");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reels"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">Create Reel</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Film className="h-5 w-5" /> Upload Video</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!preview ? (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full aspect-[9/16] max-h-80 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Click to upload a video<br />
                <span className="text-xs">MP4, WebM, MOV — max 100 MB</span>
              </p>
            </button>
          ) : (
            <div className="relative aspect-[9/16] max-h-80 bg-black rounded-lg overflow-hidden">
              <video src={preview} className="w-full h-full object-contain" controls />
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-black"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />

          <Textarea
            placeholder="Write a caption…"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{caption.length}/500</p>

          {uploading && (
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">Uploading {progress}%…</p>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={!file || uploading} className="w-full gap-2">
            <Film className="h-4 w-4" />
            {uploading ? "Publishing…" : "Publish Reel"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
