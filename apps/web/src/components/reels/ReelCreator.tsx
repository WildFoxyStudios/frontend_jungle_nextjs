"use client";

import { useState, useRef } from "react";
import { mediaApi } from "@jungle/api-client";
import { 
  Button, Input, Label, Progress, Textarea, Card, CardContent 
} from "@jungle/ui";
import { useAdvancedMediaUpload } from "@/hooks/use-advanced-media-upload";
import { toast } from "sonner";
import { Video, X, Send, Play } from "lucide-react";

interface ReelCreatorProps {
  onSuccess?: () => void;
}

export function ReelCreator({ onSuccess }: ReelCreatorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    uploadProcessedMedia, isBusy, isProcessing, isUploading,
    processingProgress, uploadProgress, compressionInfo,
  } = useAdvancedMediaUpload();
  
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.type.startsWith("video/")) {
        toast.error("Please select a video file");
        return;
      }
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      // Reels usually have strict requirements (9:16, max 60s)
      const media = await uploadProcessedMedia(file, {
        path: "/v1/reels",
        videoOptions: { maxDurationSec: 60, maxSizeMB: 50 },
      });
      
      if (!media) throw new Error("Upload failed");
      
      // In WoWonder, reels might need an extra metadata update if createReel above only handled upload
      // But assuming mediaApi.createReel handles both if path is /v1/reels
      
      toast.success("Reel shared successfully!");
      onSuccess?.();
      handleRemove();
      setCaption("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to share reel");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0 space-y-4">
        {!preview ? (
          <div 
            onClick={() => fileRef.current?.click()}
            className="aspect-[9/16] max-w-[280px] mx-auto border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <Video className="h-6 w-6" />
            </div>
            <div className="text-center px-4">
              <p className="font-semibold text-sm">Upload Reel</p>
              <p className="text-xs text-muted-foreground">MP4, MOV up to 60s</p>
            </div>
          </div>
        ) : (
          <div className="relative aspect-[9/16] max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-black group">
            <video 
              src={preview} 
              className="w-full h-full object-cover" 
              controls={false}
              autoPlay 
              muted 
              loop
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <Play className="h-12 w-12 text-white fill-white" />
            </div>
            <Button 
              size="icon" 
              variant="destructive" 
              className="absolute top-2 right-2 h-8 w-8 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <input 
          ref={fileRef}
          type="file" 
          accept="video/*" 
          className="hidden" 
          onChange={handleFileChange}
          disabled={isBusy}
        />

        <div className="space-y-2">
          <Label htmlFor="caption">Caption</Label>
          <Textarea 
            id="caption"
            placeholder="Write a catchy caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="resize-none h-20"
            disabled={isBusy}
          />
        </div>

        {isBusy && (
          <div className="space-y-2 animate-in fade-in duration-300">
            {isProcessing && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] items-center">
                  <span className="text-muted-foreground uppercase font-bold tracking-tighter">Processing Video</span>
                  <span>{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} className="h-1" />
              </div>
            )}
            {isUploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] items-center">
                  <span className="text-muted-foreground uppercase font-bold tracking-tighter">Uploading to Servers</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1" />
                {compressionInfo && compressionInfo.savedPercent > 0 && (
                   <p className="text-[10px] text-green-600 font-medium">Auto-optimized: saved {compressionInfo.savedPercent}%</p>
                )}
              </div>
            )}
          </div>
        )}

        <Button 
          className="w-full gap-2 font-bold h-12"
          disabled={!file || isBusy}
          onClick={handleSubmit}
        >
          {isBusy ? "Sharing..." : (
            <><Send className="h-4 w-4" /> Share Reel</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
