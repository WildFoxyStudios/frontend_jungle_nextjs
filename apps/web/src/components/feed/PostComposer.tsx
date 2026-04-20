"use client";

import { useState, useRef, useCallback } from "react";
import { useAuthStore } from "@jungle/hooks";
import Link from "next/link";
import { useAdvancedMediaUpload } from "@/hooks/use-advanced-media-upload";
import { postsApi } from "@jungle/api-client";
import { resolveAvatarUrl } from "@/lib/avatar";
import type { Post, MediaItem } from "@jungle/api-client";
import {
  Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent, Textarea,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Progress,
  Popover, PopoverContent, PopoverTrigger,
} from "@jungle/ui";
import {
  Image as ImageIcon, Film, X, Smile, MapPin, Palette, BarChart3, Paperclip,
  Clock, Music, FileText, Volume2, Loader2, Sparkles, Mic, ShoppingBag, PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { GifPicker } from "@/components/shared/GifPicker";
import { MentionSuggestions, detectMention } from "@/components/shared/MentionSuggestions";
import { AiWriterDialog } from "@/components/shared/AiWriterDialog";

interface PostComposerProps {
  groupId?: number;
  pageId?: number;
  onSuccess?: (post: Post) => void;
}

let _mediaKeyCounter = 0;

export function PostComposer({ groupId, pageId, onSuccess }: PostComposerProps) {
  const { user } = useAuthStore();
  const t = useTranslations("feed");
  const tp = useTranslations("post");
  const tc = useTranslations("common");
  const {
    uploadProcessedMedia, isProcessing, isUploading, isBusy,
    processingProgress, uploadProgress, compressionInfo,
  } = useAdvancedMediaUpload();
  const [content, setContent] = useState("");
  const [privacy, setPrivacy] = useState<Post["privacy"]>("public");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<(MediaItem & { _key: number })[]>([]);
  const [feeling, setFeeling] = useState("");
  const [location, setLocation] = useState("");
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [coloredBg, setColoredBg] = useState("");
  const [coloredText, setColoredText] = useState("");
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);
  const [showAiWriter, setShowAiWriter] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addLocalMedia = useCallback((file: File, type: "image" | "video" | "audio" | "file") => {
    const key = ++_mediaKeyCounter;
    const localUrl = URL.createObjectURL(file);
    const localItem: MediaItem & { _key: number; _uploading?: boolean; _localUrl?: string } = {
      id: Date.now() + key,
      url: localUrl,
      type,
      name: file.name,
      _key: key,
      _uploading: true,
      _localUrl: localUrl,
    };
    setPendingMedia((prev) => [...prev, localItem]);
    return key;
  }, []);

  const updateMedia = useCallback((key: number, updates: Partial<MediaItem> & { _uploading?: boolean }) => {
    setPendingMedia((prev) =>
      prev.map((m) => (m._key === key ? { ...m, ...updates } : m)),
    );
  }, []);

  const removeMediaByKey = useCallback((key: number) => {
    setPendingMedia((prev) => {
      const item = prev.find((m) => m._key === key);
      if (item) {
        const raw = item as unknown as Record<string, unknown>;
        if (raw._localUrl) URL.revokeObjectURL(raw._localUrl as string);
      }
      return prev.filter((m) => m._key !== key);
    });
  }, []);

  const uploadFile = useCallback(async (
    file: File,
    type: "image" | "video" | "audio" | "file",
    key: number,
    opts?: Parameters<typeof uploadProcessedMedia>[1],
  ) => {
    try {
      const result = await uploadProcessedMedia(file, opts);
      if (result) {
        updateMedia(key, {
          id: result.id,
          url: result.url,
          type: type === "file" ? "file" as const : result.type,
          thumbnail: result.thumbnail,
          name: type === "file" ? file.name : result.name,
          _uploading: false,
        });
      } else {
        toast.error(`${t("failedUpload")} ${file.name}`);
        removeMediaByKey(key);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `${t("failedUpload")} ${file.name}`);
      removeMediaByKey(key);
    }
  }, [uploadProcessedMedia, updateMedia, removeMediaByKey, t]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    for (const file of files) {
      const key = addLocalMedia(file, "image");
      uploadFile(file, "image", key, { imageOptions: { maxWidth: 2048, maxSizeMB: 2 } });
    }
  };

  const handleVideoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const key = addLocalMedia(file, "video");
    uploadFile(file, "video", key, { videoOptions: { maxDurationSec: 120, maxSizeMB: 50 } });
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const key = addLocalMedia(file, "file");
    uploadFile(file, "file", key);
  };

  const handleAudioPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const key = addLocalMedia(file, "audio");
    uploadFile(file, "audio", key);
  };

  const handleGifSelect = (gifUrl: string) => {
    setContent((prev) => (prev ? prev + "\n" : "") + gifUrl);
  };

  const removeMedia = (key: number) => removeMediaByKey(key);

  const resetForm = () => {
    setContent("");
    setIsExpanded(false);
    setPendingMedia([]);
    setFeeling("");
    setLocation("");
    setColoredBg("");
    setColoredText("");
    setShowPollCreator(false);
    setPollOptions(["", ""]);
    setShowLocationInput(false);
    setScheduledAt("");
    setShowScheduler(false);
  };

  const hasUploadingMedia = pendingMedia.some((m) => (m as unknown as Record<string, unknown>)._uploading);

  const handleSubmit = async () => {
    if (!content.trim() && pendingMedia.length === 0) return;
    if (hasUploadingMedia) {
      toast.warning(t("waitUpload"));
      return;
    }
    setIsLoading(true);
    try {
      const validPollOptions = pollOptions.filter((o) => o.trim());
      const uploadedMedia = pendingMedia
        .filter((m) => !(m as unknown as Record<string, unknown>)._uploading)
        .filter((m) => !m.url.startsWith("blob:"))
        .map((m) => ({ id: m.id, url: m.url, type: m.type, thumbnail: m.thumbnail }));
      const post = await postsApi.createPost({
        content,
        privacy,
        group_id: groupId,
        page_id: pageId,
        feeling: feeling || undefined,
        location: location || undefined,
        colored_background: coloredBg || undefined,
        colored_text_color: coloredText || undefined,
        poll_options: validPollOptions.length >= 2 ? validPollOptions : undefined,
        scheduled_at: scheduledAt || undefined,
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
      });
      // Revoke all local blob URLs before clearing
      for (const m of pendingMedia) {
        const raw = m as unknown as Record<string, unknown>;
        if (raw._localUrl) URL.revokeObjectURL(raw._localUrl as string);
      }
      resetForm();
      onSuccess?.(post);
      toast.success(scheduledAt ? tp("scheduled") : tp("published"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tp("failed"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={resolveAvatarUrl(user.avatar)} />
            <AvatarFallback>{user.first_name?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder={t("whatsOnYourMind")}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setIsExpanded(true)}
                rows={isExpanded ? 4 : 2}
                className="resize-none"
                style={coloredBg ? {
                  background: coloredBg,
                  color: coloredText || "#fff",
                  textAlign: "center",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  minHeight: "120px",
                  borderRadius: "0.5rem",
                } : undefined}
              />
              {(() => {
                const { mentionQuery, isMentioning } = detectMention(
                  content,
                  textareaRef.current?.selectionStart ?? content.length,
                );
                return (
                  <MentionSuggestions
                    query={mentionQuery}
                    visible={isMentioning}
                    onSelect={(username) => {
                      const pos = textareaRef.current?.selectionStart ?? content.length;
                      const before = content.slice(0, pos).replace(/@\w*$/, `@${username} `);
                      const after = content.slice(pos);
                      setContent(before + after);
                      textareaRef.current?.focus();
                    }}
                  />
                );
              })()}
            </div>

            {/* Feeling badge */}
            {feeling && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{tp("feeling", { feeling })}</span>
                <button type="button" onClick={() => setFeeling("")} className="hover:text-foreground"><X className="h-3 w-3" /></button>
              </div>
            )}

            {/* Location badge */}
            {location && !showLocationInput && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{location}</span>
                <button type="button" onClick={() => { setLocation(""); }} className="hover:text-foreground"><X className="h-3 w-3" /></button>
              </div>
            )}

            {/* Location input */}
            {showLocationInput && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  className="flex-1 text-sm bg-transparent border-b border-muted-foreground/30 outline-none py-1"
                  placeholder={tp("addLocation")}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") setShowLocationInput(false); }}
                />
                <button type="button" onClick={() => { setShowLocationInput(false); setLocation(""); }}><X className="h-3 w-3" /></button>
              </div>
            )}

            {/* Poll creator */}
            {showPollCreator && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">{tp("pollOptions")}</p>
                  <button type="button" onClick={() => { setShowPollCreator(false); setPollOptions(["", ""]); }}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </div>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      className="flex-1 text-sm bg-background border rounded px-2 py-1"
                      placeholder={tp("optionN", { n: idx + 1 })}
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollOptions];
                        next[idx] = e.target.value;
                        setPollOptions(next);
                      }}
                    />
                    {pollOptions.length > 2 && (
                      <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}>
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 6 && (
                  <Button variant="ghost" size="sm" className="text-xs" type="button" onClick={() => setPollOptions([...pollOptions, ""])}>
                    + {tp("addOption")}
                  </Button>
                )}
              </div>
            )}

            {/* Pending media previews */}
            {pendingMedia.length > 0 && (
              <div className="grid grid-cols-3 gap-1">
                {pendingMedia.map((m) => {
                  const uploading = !!(m as unknown as Record<string, unknown>)._uploading;
                  return (
                    <div key={m._key} className="relative aspect-square bg-muted rounded overflow-hidden group">
                      {m.type === "image" && m.url ? (
                        <img src={m.url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : m.type === "video" && m.url ? (
                        <video src={m.url} className="w-full h-full object-cover" muted />
                      ) : m.type === "audio" ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                          <Volume2 className="h-6 w-6 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground truncate px-1">{m.name ?? tc("audio")}</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground truncate px-1">{m.name ?? tc("file")}</span>
                        </div>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 text-white animate-spin" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(m._key)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Scheduler */}
            {showScheduler && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">{tp("schedulePost")}</p>
                  <button type="button" onClick={() => { setShowScheduler(false); setScheduledAt(""); }}><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
                </div>
                <input
                  type="datetime-local"
                  className="text-sm bg-background border rounded px-2 py-1 w-full"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
                {scheduledAt && (
                  <p className="text-xs text-muted-foreground">
                    {tp("willPublishAt", { date: new Date(scheduledAt).toLocaleString() })}
                  </p>
                )}
              </div>
            )}

            {/* Processing / Upload progress */}
            {isBusy && (
              <div className="space-y-1">
                {isProcessing && (
                  <div>
                    <p className="text-xs text-muted-foreground">{tp("optimizing")} {processingProgress}%</p>
                    <Progress value={processingProgress} className="h-1" />
                  </div>
                )}
                {isUploading && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {tp("uploading")} {uploadProgress}%
                      {compressionInfo && compressionInfo.savedPercent > 0 && (
                        <span className="text-green-600 ml-1">
                          ({tc("savedPercent", { n: compressionInfo.savedPercent })})
                        </span>
                      )}
                    </p>
                    <Progress value={uploadProgress} className="h-1" />
                  </div>
                )}
              </div>
            )}

            {isExpanded && (
              <div className="flex items-center justify-between">
                <div className="flex gap-1 items-center flex-wrap">
                  <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagePick} />
                  <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoPick} />
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt" className="hidden" onChange={handleFilePick} />
                  <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioPick} />
                  <Button variant="ghost" size="sm" title={t("photo")} type="button" onClick={() => imageInputRef.current?.click()} disabled={isBusy}>
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title={t("video")} type="button" onClick={() => videoInputRef.current?.click()} disabled={isBusy}>
                    <Film className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title={tp("audio")} type="button" onClick={() => audioInputRef.current?.click()} disabled={isBusy}>
                    <Music className="h-4 w-4" />
                  </Button>
                  <EmojiPicker onEmojiSelect={(emoji) => {
                    setContent((prev) => prev + emoji);
                    textareaRef.current?.focus();
                  }} />
                  <GifPicker onGifSelect={handleGifSelect} />
                  <FeelingPicker value={feeling} onChange={setFeeling} />
                  <Button variant="ghost" size="sm" title={tp("locationLink")} type="button" onClick={() => setShowLocationInput(!showLocationInput)}>
                    <MapPin className="h-4 w-4" />
                  </Button>
                  <ColorPicker
                    active={!!coloredBg}
                    onSelect={(bg, text) => { setColoredBg(bg); setColoredText(text); }}
                    onClear={() => { setColoredBg(""); setColoredText(""); }}
                  />
                  <Button variant="ghost" size="sm" title={tp("poll")} type="button" onClick={() => setShowPollCreator(!showPollCreator)}>
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title={tp("attachFile")} type="button" onClick={() => fileInputRef.current?.click()} disabled={isBusy}>
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title={tp("voiceNote")} type="button" className="text-red-500 hover:bg-red-50" onClick={() => toast.info(tc("comingSoon"))}>
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title={tp("sellProduct")} asChild>
                    <Link href="/marketplace/create">
                      <ShoppingBag className="h-4 w-4 text-orange-500" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" title={tp("schedule")} type="button" onClick={() => setShowScheduler(!showScheduler)}>
                    <Clock className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title={tp("aiWriter")} type="button" onClick={() => setShowAiWriter(true)} className="text-primary">
                    <Sparkles className="h-4 w-4" />
                  </Button>
                  <Select value={privacy} onValueChange={(v) => setPrivacy(v as typeof privacy)}>
                    <SelectTrigger className="h-8 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">{tc("public")}</SelectItem>
                      <SelectItem value="friends">{tc("friends")}</SelectItem>
                      <SelectItem value="people_i_follow">{tp("peopleIFollow")}</SelectItem>
                      <SelectItem value="people_follow_me">{tp("peopleFollowMe")}</SelectItem>
                      <SelectItem value="anonymous">{tp("anonymous")}</SelectItem>
                      <SelectItem value="only_me">{tc("onlyMe")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" type="button" onClick={resetForm}>
                    {tc("cancel")}
                  </Button>
                  <Button size="sm" type="button" onClick={handleSubmit} disabled={isLoading || hasUploadingMedia || (!content.trim() && pendingMedia.length === 0)}>
                    {isLoading ? `${tc("loading")}` : hasUploadingMedia ? tc("uploading") : tc("submit")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    <AiWriterDialog
        open={showAiWriter}
        onClose={() => setShowAiWriter(false)}
        onInsertText={(text) => { setContent((prev) => prev ? prev + "\n" + text : text); setIsExpanded(true); }}
      />
    </Card>
  );
}

const FEELINGS = [
  { emoji: "😊", label: "happy" },
  { emoji: "😍", label: "loved" },
  { emoji: "😎", label: "cool" },
  { emoji: "😢", label: "sad" },
  { emoji: "😡", label: "angry" },
  { emoji: "😴", label: "sleepy" },
  { emoji: "🤔", label: "thinking" },
  { emoji: "😂", label: "funny" },
  { emoji: "🥳", label: "celebrating" },
  { emoji: "😤", label: "frustrated" },
  { emoji: "🤒", label: "sick" },
  { emoji: "😇", label: "blessed" },
  { emoji: "🥰", label: "grateful" },
  { emoji: "😏", label: "mischievous" },
  { emoji: "🤩", label: "excited" },
  { emoji: "😋", label: "hungry" },
];

function FeelingPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("post");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" title={t("feelingLink")} type="button">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" side="top" align="start">
        <p className="text-xs font-medium mb-2 px-1">{t("feelingQuestion")}</p>
        <div className="grid grid-cols-4 gap-1">
          {FEELINGS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => { onChange(`${f.emoji} ${t("feelings." + f.label)}`); setOpen(false); }}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded text-xs hover:bg-muted transition-colors ${
                value.includes(f.label) ? "bg-primary/10 ring-1 ring-primary" : ""
              }`}
            >
              <span className="text-lg">{f.emoji}</span>
              <span className="truncate w-full text-center text-[10px]">{t("feelings." + f.label)}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const COLOR_PRESETS = [
  { bg: "#1a73e8", text: "#ffffff" },
  { bg: "#e91e63", text: "#ffffff" },
  { bg: "#9c27b0", text: "#ffffff" },
  { bg: "#4caf50", text: "#ffffff" },
  { bg: "#ff9800", text: "#ffffff" },
  { bg: "#f44336", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", text: "#ffffff" },
  { bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", text: "#333333" },
];

function ColorPicker({
  active,
  onSelect,
  onClear,
}: {
  active: boolean;
  onSelect: (bg: string, text: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("post");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" title={t("coloredPost")} type="button" className={active ? "text-primary" : ""}>
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" side="top" align="start">
        <p className="text-xs font-medium mb-2 px-1">{t("bgColor")}</p>
        <div className="grid grid-cols-5 gap-1.5">
          {COLOR_PRESETS.map((c, i) => (
            <button
              key={i}
              type="button"
              className="h-8 w-8 rounded-full border-2 border-transparent hover:border-foreground/30 transition-colors"
              style={{ background: c.bg }}
              onClick={() => { onSelect(c.bg, c.text); setOpen(false); }}
            />
          ))}
        </div>
        {active && (
          <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => { onClear(); setOpen(false); }}>
            {t("removeColor")}
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
