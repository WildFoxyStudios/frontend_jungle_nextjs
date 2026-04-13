"use client";

import { useState, useRef } from "react";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { compressImage } from "@jungle/utils";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@jungle/ui";

interface AvatarCropperProps {
  onCropComplete: (croppedFile: File) => void;
}

export function AvatarCropper({ onCropComplete }: AvatarCropperProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({ unit: "%", width: 100, height: 100, x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCrop = async () => {
    if (!imgRef.current || !src) return;
    const canvas = document.createElement("canvas");
    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    canvas.width = (crop.width / 100) * img.naturalWidth;
    canvas.height = (crop.height / 100) * img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      img,
      (crop.x / 100) * img.naturalWidth,
      (crop.y / 100) * img.naturalHeight,
      canvas.width,
      canvas.height,
      0, 0, canvas.width, canvas.height
    );
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const compressed = await compressImage(file, "avatar");
      onCropComplete(compressed);
      setSrc(null);
    }, "image/jpeg");
  };

  return (
    <>
      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="avatar-input" />
      <label htmlFor="avatar-input" className="cursor-pointer">
        <Button variant="outline" size="sm" asChild><span>Change avatar</span></Button>
      </label>
      <Dialog open={!!src} onOpenChange={() => setSrc(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crop avatar</DialogTitle></DialogHeader>
          {src && (
            <div className="space-y-4">
              <ReactCrop crop={crop} onChange={setCrop} aspect={1} circularCrop>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={imgRef} src={src} alt="Crop preview" />
              </ReactCrop>
              <Button onClick={handleCrop} className="w-full">Apply crop</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
