"use client";

import { useState } from "react";
import { contentApi } from "@jungle/api-client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Textarea, Label, Input, Tabs, TabsContent, TabsList, TabsTrigger,
} from "@jungle/ui";
import { Sparkles, Loader2, Copy, Check, Wand2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface AiWriterDialogProps {
  open: boolean;
  onClose: () => void;
  onInsertText?: (text: string) => void;
  onInsertImage?: (url: string) => void;
  mode?: "post" | "blog" | "image";
}

export function AiWriterDialog({ open, onClose, onInsertText, onInsertImage, mode = "post" }: AiWriterDialogProps) {
  const [tab, setTab] = useState<"text" | "image">(mode === "image" ? "image" : "text");
  const [prompt, setPrompt] = useState("");
  const [maxWords, setMaxWords] = useState("150");
  const [generatedText, setGeneratedText] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateText = async () => {
    if (!prompt.trim()) { toast.error("Enter a prompt first"); return; }
    setGenerating(true);
    setGeneratedText("");
    try {
      const res = await contentApi.aiGeneratePost({
        prompt,
        maxTokens: Math.min(Math.max(Number(maxWords) || 150, 20), 500) * 2,
      });
      setGeneratedText(res.content);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!prompt.trim()) { toast.error("Enter a prompt first"); return; }
    setGenerating(true);
    setGeneratedImages([]);
    try {
      const res = await contentApi.aiGenerateImages({ prompt, n: 4 });
      setGeneratedImages(res.urls);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsertText = () => {
    if (generatedText && onInsertText) {
      onInsertText(generatedText);
      onClose();
      setGeneratedText("");
      setPrompt("");
    }
  };

  const handleInsertImage = () => {
    if (selectedImage && onInsertImage) {
      onInsertImage(selectedImage);
      onClose();
      setGeneratedImages([]);
      setSelectedImage("");
      setPrompt("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> AI Writer
          </DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "text" | "image")}>
          <TabsList className="w-full">
            <TabsTrigger value="text" className="flex-1 gap-1.5"><Wand2 className="h-3.5 w-3.5" /> Generate Text</TabsTrigger>
            <TabsTrigger value="image" className="flex-1 gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Generate Images</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-3 mt-4">
            <div className="space-y-1.5">
              <Label>What should I write about?</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Tell me a joke about developers, Write a post about summer…"
                rows={3}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleGenerateText(); } }}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Label className="shrink-0 text-sm">Max words</Label>
                <Input
                  type="number"
                  value={maxWords}
                  onChange={(e) => setMaxWords(e.target.value)}
                  min={20}
                  max={500}
                  className="w-24"
                />
              </div>
              <Button onClick={handleGenerateText} disabled={generating || !prompt.trim()} className="gap-1.5">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Generating…" : "Generate"}
              </Button>
            </div>
            {generatedText && (
              <div className="space-y-2">
                <div className="relative rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm whitespace-pre-wrap pr-8">{generatedText}</p>
                  <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {onInsertText && (
                  <Button onClick={handleInsertText} className="w-full gap-1.5">
                    <Wand2 className="h-4 w-4" /> Insert into Post
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="image" className="space-y-3 mt-4">
            <div className="space-y-1.5">
              <Label>Describe the image</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A beautiful sunset over mountains, A futuristic city at night…"
                rows={3}
              />
            </div>
            <Button onClick={handleGenerateImages} disabled={generating || !prompt.trim()} className="w-full gap-1.5">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              {generating ? "Generating…" : "Generate Images"}
            </Button>
            {generatedImages.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {generatedImages.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(selectedImage === url ? "" : url)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === url ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img src={url} alt={`Generated ${i + 1}`} className="w-full h-full object-cover" />
                      {selectedImage === url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="h-8 w-8 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedImage && onInsertImage && (
                  <Button onClick={handleInsertImage} className="w-full gap-1.5">
                    <ImageIcon className="h-4 w-4" /> Use This Image
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
