"use client";

import { useState, useEffect } from "react";
import { postsApi, messagesApi } from "@jungle/api-client";
import type { Conversation } from "@jungle/api-client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Button, Textarea, Separator, Avatar, AvatarImage, AvatarFallback, ScrollArea,
} from "@jungle/ui";
import { Share2, Copy, ExternalLink, Check, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@jungle/hooks";

interface ShareDialogProps {
  postId: number;
  children: React.ReactNode;
}

export function ShareDialog({ postId, children }: ShareDialogProps) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sendingTo, setSendingTo] = useState<number | null>(null);

  const postUrl = typeof window !== "undefined"
    ? `${window.location.origin}/post/${postId}`
    : `/post/${postId}`;

  useEffect(() => {
    if (!open) return;
    messagesApi.getConversations()
      .then((r) => setConversations(Array.isArray(r?.data) ? r.data : []))
      .catch(() => { /* non-critical: failure is silent */ });
  }, [open]);

  const handleSendToConversation = async (convId: number) => {
    setSendingTo(convId);
    try {
      await messagesApi.sendMessage(convId, { content: postUrl, type: "text" });
      toast.success("Sent!");
    } catch {
      toast.error("Failed to send");
    } finally {
      setSendingTo(null);
    }
  };

  const handleShareToTimeline = async () => {
    setSharing(true);
    try {
      await postsApi.sharePost(postId, content);
      toast.success("Shared to your timeline!");
      setOpen(false);
      setContent("");
    } catch {
      toast.error("Failed to share");
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleExternal = (platform: string) => {
    const text = encodeURIComponent("Check this out on Jungle!");
    const url = encodeURIComponent(postUrl);
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    };
    if (urls[platform]) window.open(urls[platform], "_blank", "width=600,height=400");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" /> Share Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share to timeline */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Share to your timeline</p>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Say something about this…"
              rows={2}
              className="resize-none"
            />
            <Button onClick={handleShareToTimeline} disabled={sharing} className="w-full">
              {sharing ? "Sharing…" : "Share to Timeline"}
            </Button>
          </div>

          <Separator />

          {/* Copy link */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Copy link</p>
            <div className="flex gap-2">
              <code className="flex-1 text-xs bg-muted px-3 py-2 rounded truncate">{postUrl}</code>
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Send to conversation */}
          {conversations.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Send in a message</p>
                <ScrollArea className="max-h-36">
                  <div className="space-y-1">
                    {conversations.slice(0, 8).map((conv) => {
                      const other = conv.members.find((m) => m.user.id !== user?.id)?.user;
                      const name = conv.name ?? `${other?.first_name ?? ""} ${other?.last_name ?? ""}`.trim();
                      return (
                        <div key={conv.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={conv.avatar ?? other?.avatar} />
                            <AvatarFallback>{(name || "?")[0]}</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 text-sm truncate">{name || "Conversation"}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            disabled={sendingTo === conv.id}
                            onClick={() => handleSendToConversation(conv.id)}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          <Separator />

          {/* External share */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Share externally</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "twitter", label: "X / Twitter" },
                { key: "facebook", label: "Facebook" },
                { key: "linkedin", label: "LinkedIn" },
                { key: "whatsapp", label: "WhatsApp" },
                { key: "telegram", label: "Telegram" },
              ].map((p) => (
                <Button key={p.key} variant="outline" size="sm" className="gap-1.5" onClick={() => handleExternal(p.key)}>
                  <ExternalLink className="h-3.5 w-3.5" /> {p.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
