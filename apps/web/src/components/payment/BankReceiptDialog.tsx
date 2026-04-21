"use client";

import { useState, useRef } from "react";
import { Button, Input, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Label } from "@jungle/ui";
import { paymentsApi, mediaApi } from "@jungle/api-client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Upload, X, FileText } from "lucide-react";

interface BankReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
}

export function BankReceiptDialog({ open, onOpenChange, amount }: BankReceiptDialogProps) {
  const tc = useTranslations("common");
  const tp = useTranslations("payments");
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async () => {
    if (!file) return toast.error("Please upload a receipt image");
    setLoading(true);
    try {
      // Step 1: Upload media
      const formData = new FormData();
      formData.append("file", file);
      const mediaRes = await mediaApi.uploadMedia(formData);
      
      // Step 2: Submit receipt record
      await paymentsApi.uploadBankReceipt({
        price: amount,
        description,
        mode: "wallet",
        receipt_file: (mediaRes.file_url || "") as string
      });

      toast.success("Receipt uploaded successfully! An admin will review it.");
      onOpenChange(false);
      setFile(null);
      setPreview(null);
      setDescription("");
    } catch (error) {
      toast.error("Failed to upload receipt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bank Transfer Receipt</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="p-4 bg-muted rounded-lg border border-dashed text-center space-y-4">
             <p className="text-xs text-muted-foreground uppercase font-bold">Transfer Details</p>
             <p className="text-2xl font-black">${amount.toFixed(2)}</p>
             <div className="text-[10px] text-muted-foreground leading-tight bg-background p-2 rounded border">
                Transfer to: <br/>
                <strong>Bank of Social, Account #123456789</strong><br/>
                IBAN: US89 1234 5678 9012 3456
             </div>
          </div>

          <div className="grid gap-2">
            <Label>Receipt Image</Label>
            {preview ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 h-6 w-6" 
                  onClick={() => { setFile(null); setPreview(null); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Click to upload photo</span>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="desc">Additional Note</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any comments for the admin..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            {tc("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !file}>
            {loading ? "Uploading..." : "Submit Receipt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
