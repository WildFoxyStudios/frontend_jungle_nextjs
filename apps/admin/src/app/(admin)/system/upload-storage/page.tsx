"use client";
import { useRef, useState } from "react";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Card, CardContent, Progress } from "@jungle/ui";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export default function UploadStoragePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploaded, setUploaded] = useState<string[]>([]);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    setProgress(0);
    const total = files.length;
    let done = 0;

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        await adminApi.uploadToStorage(fd);
        done++;
        setProgress(Math.round((done / total) * 100));
        setUploaded((prev) => [...prev, file.name]);
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    if (done > 0) toast.success(`${done} file(s) uploaded to storage`);
  };

  return (
    <AdminPageShell title="Upload to Storage" description="Directly upload files to the configured storage provider">
      <Card className="max-w-lg">
        <CardContent className="p-6 space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files); }}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Click or drag files here to upload</p>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files); e.target.value = ""; }} />
          </div>

          {uploading && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Uploading… {progress}%</p>
              <Progress value={progress} />
            </div>
          )}

          {uploaded.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium">Uploaded files:</p>
              {uploaded.map((name, i) => <p key={i} className="text-xs text-muted-foreground">✓ {name}</p>)}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
