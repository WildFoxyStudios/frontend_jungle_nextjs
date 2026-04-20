"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { messagesApi } from "@jungle/api-client";
import type { Message, Conversation } from "@jungle/api-client";
import { useRealtimeStore, useAuthStore, useOnlineUsers } from "@jungle/hooks";
import { useAdvancedMediaUpload } from "@/hooks/use-advanced-media-upload";
import { Button, Input, ScrollArea, Avatar, AvatarImage, AvatarFallback, Popover, PopoverContent, PopoverTrigger } from "@jungle/ui";
import { toast } from "sonner";
import { Send, Image as ImageIcon, Paperclip, Search, Mic, Square, Phone, Video, ArrowLeft, Smile, Gift, PanelRight } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { ChatSidebarTabs } from "./ChatSidebarTabs";
import { TypingIndicator } from "./TypingIndicator";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { GiftPicker } from "./GiftPicker";
import { StickerPicker } from "./StickerPicker";
import type { Gift as GiftType, Sticker } from "@jungle/api-client";
import { resolveAvatarUrl } from "@/lib/avatar";
import Link from "next/link";

interface ChatWindowProps {
  conversationId: number;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { typingUsers, send } = useRealtimeStore();
  const { user } = useAuthStore();
  const onlineUsers = useOnlineUsers();
  const { uploadProcessedMedia, isBusy: isUploading } = useAdvancedMediaUpload();
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const isTyping = (typingUsers.get(conversationId)?.length ?? 0) > 0;

  useEffect(() => {
    messagesApi.getConversation(conversationId)
      .then(setConversation)
      .catch(() => toast.error("Failed to load conversation"));
    messagesApi.getMessages(conversationId)
      .then((r) => {
        setMessages(Array.isArray(r?.data) ? r.data : []);
        setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
      })
      .catch(() => toast.error("Failed to load messages"));
  }, [conversationId]);

  const other = conversation?.members?.find((m) => m.user.id !== user?.id)?.user;
  const chatTitle = conversation?.name ?? (other ? `${other.first_name} ${other.last_name}` : "Chat");
  const isOtherOnline = other ? onlineUsers.has(other.id) : false;

  const makeSender = () =>
    user ? { ...user, is_online: true } : { id: 0, uuid: "", username: "", first_name: "You", last_name: "", avatar: "", is_verified: false, is_online: true, is_pro: 0 };

  const handleSend = async () => {
    if (!content.trim()) return;
    const optimistic: Message = {
      id: Date.now(),
      conversation_id: conversationId,
      sender_id: user?.id ?? 0,
      content,
      message_type: "text",
      media: [],
      is_favorited: false,
      is_pinned: false,
      reactions: {},
      created_at: new Date().toISOString(),
      sender: makeSender(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setContent("");
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    try {
      const sent = await messagesApi.sendMessage(conversationId, { content, type: "text" });
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? sent : m));
    } catch {
      toast.error("Failed to send message");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  };

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const media = await uploadProcessedMedia(file);
      if (media) {
        const sent = await messagesApi.sendMessage(conversationId, {
          type: file.type.startsWith("video") ? "video" : "image",
          media_id: media.id,
        });
        setMessages((prev) => [...prev, sent]);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch { toast.error("Failed to send media"); }
    e.target.value = "";
  }, [conversationId, uploadProcessedMedia]);

  const handleSendSticker = async (sticker: Sticker) => {
    setStickerOpen(false);
    try {
      const sent = await messagesApi.sendMessage(conversationId, { type: "sticker", sticker_id: sticker.id });
      setMessages((prev) => [...prev, sent]);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch { toast.error("Failed to send sticker"); }
  };

  const handleSendGift = async (gift: GiftType) => {
    setGiftOpen(false);
    try {
      const sent = await messagesApi.sendMessage(conversationId, { type: "gift", gift_id: gift.id, content: gift.name });
      setMessages((prev) => [...prev, sent]);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch { toast.error("Failed to send gift"); }
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const media = await uploadProcessedMedia(file);
      if (media) {
        const sent = await messagesApi.sendMessage(conversationId, {
          content: file.name,
          type: "file",
          media_id: media.id,
        });
        setMessages((prev) => [...prev, sent]);
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch { toast.error("Failed to send file"); }
    e.target.value = "";
  }, [conversationId, uploadProcessedMedia]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        try {
          const media = await uploadProcessedMedia(file);
          if (media) {
            const sent = await messagesApi.sendMessage(conversationId, {
              type: "audio",
              media_id: media.id,
              content: "Voice message",
            });
            setMessages((prev) => [...prev, sent]);
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }
        } catch { toast.error("Failed to send voice message"); }
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setRecordingTime(0);
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await messagesApi.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("Message deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const handleReactToMessage = async (messageId: number, reaction: string) => {
    try {
      await messagesApi.reactToMessage(messageId, reaction);
      setMessages((prev) => prev.map((m) =>
        m.id === messageId
          ? { ...m, my_reaction: reaction, reactions: { ...m.reactions, [reaction]: (m.reactions[reaction] ?? 0) + 1 } }
          : m
      ));
    } catch { /* silent */ }
  };

  const filteredMessages = showSearch && searchQuery
    ? messages.filter((m) => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex h-full">
      <div className="flex flex-col flex-1 min-w-0 h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-background shrink-0">
        <Link href="/messages" className="lg:hidden">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarImage src={resolveAvatarUrl(conversation?.avatar ?? other?.avatar)} />
            <AvatarFallback>{chatTitle[0]}</AvatarFallback>
          </Avatar>
          {isOtherOnline && (
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{chatTitle}</p>
          <p className="text-xs text-muted-foreground">{isOtherOnline ? "Online" : "Offline"}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Audio call">
            <Link href={`/call/audio-${conversationId}`}><Phone className="h-4 w-4" /></Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Video call">
            <Link href={`/call/video-${conversationId}`}><Video className="h-4 w-4" /></Link>
          </Button>
          <Button
            variant={showSidebar ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 hidden md:inline-flex"
            onClick={() => setShowSidebar((v) => !v)}
            title="Conversation info"
          >
            <PanelRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="border-b px-3 py-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages…"
            className="h-8 text-sm"
            autoFocus
          />
        </div>
      )}

      <ScrollArea className="flex-1 p-4">
        {filteredMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onDelete={handleDeleteMessage}
            onReact={handleReactToMessage}
          />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </ScrollArea>

      <div className="border-t p-3 space-y-1">
        <input ref={imageInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleImageUpload} />
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.zip,.rar,.txt,.xls,.xlsx" className="hidden" onChange={handleFileUpload} />
        <div className="flex gap-1.5 items-center">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => imageInputRef.current?.click()} disabled={isUploading} title="Send image/video">
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => fileInputRef.current?.click()} disabled={isUploading} title="Attach file">
            <Paperclip className="h-4 w-4" />
          </Button>
          <EmojiPicker
            onEmojiSelect={(emoji) => setContent((prev) => prev + emoji)}
            triggerClassName="h-8 w-8 p-0"
          />
          <Popover open={stickerOpen} onOpenChange={setStickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="Stickers">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-64 p-0">
              <StickerPicker onSelect={handleSendSticker} />
            </PopoverContent>
          </Popover>
          <Popover open={giftOpen} onOpenChange={setGiftOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title="Send gift">
                <Gift className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-56 p-0">
              <GiftPicker onSelect={handleSendGift} />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowSearch(!showSearch)} title="Search messages">
            <Search className="h-4 w-4" />
          </Button>
          <Input
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              send("typing.start", { conversation_id: conversationId });
            }}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message…"
            className="flex-1 h-8 text-sm"
            disabled={isUploading}
          />
          <Button
            variant={recording ? "destructive" : "ghost"}
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={recording ? stopRecording : startRecording}
            disabled={isUploading}
            title={recording ? "Stop recording" : "Voice message"}
          >
            {recording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
          </Button>
          {recording && (
            <span className="text-xs text-destructive font-mono animate-pulse">
              {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
          )}
          <Button onClick={handleSend} disabled={!content.trim() || isUploading} size="icon" className="h-8 w-8 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      </div>

      {showSidebar && (
        <div className="hidden md:flex w-80 h-full shrink-0">
          <ChatSidebarTabs conversationId={conversationId} />
        </div>
      )}
    </div>
  );
}
