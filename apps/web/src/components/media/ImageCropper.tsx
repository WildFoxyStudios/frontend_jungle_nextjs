"use client";

import { useRef, useState } from "react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@jungle/ui";

interface ImageCropperProps {
  src: string;
  aspect?: number;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropper({ src, aspect = 1, onCrop, onCancel }: ImageCropperProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>({ unit: "%", width: 80, height: 80, x: 10, y: 10 });

  const handleCrop = () => {
    if (!imgRef.current) return;
    const canvas = document.createElement("canvas");
    const img = imgRef.current;
    canvas.width = (crop.width / 100) * img.naturalWidth;
    canvas.height = (crop.height / 100) * img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(
      img,
      (crop.x / 100) * img.naturalWidth,
      (crop.y / 100) * img.naturalHeight,
      canvas.width, canvas.height,
      0, 0, canvas.width, canvas.height
    );
    canvas.toBlob((blob) => { if (blob) onCrop(blob); }, "image/jpeg", 0.9);
  };

  return (
    <div className="space-y-4">
      <ReactCrop crop={crop} onChange={setCrop} aspect={aspect}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imgRef} src={src} alt="Crop" className="max-h-96" />
      </ReactCrop>
      <div className="flex gap-2">
        <Button onClick={handleCrop} className="flex-1">Apply</Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
      </div>
    </div>
  );
}
