"use client";

import { useCallback, useEffect, useState } from "react";
import { messagesApi } from "@jungle/api-client";
import type { Message } from "@jungle/api-client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Skeleton,
  Input,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@jungle/ui";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  Pin,
  Star,
  Search,
  ExternalLink,
} from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { formatDistanceToNow } from "@/lib/date";

interface Props {
  conversationId: number;
  onMessageClick?: (messageId: number) => void;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export function ChatSidebarTabs({ conversationId, onMessageClick }: Props) {
  return (
    <div className="flex flex-col h-full border-l bg-background">
      <Tabs defaultValue="media" className="flex flex-col h-full">
        <TabsList className="grid grid-cols-6 mx-2 mt-2 shrink-0">
          <TabsTrigger value="media" title="Media" className="px-1">
            <ImageIcon className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="files" title="Files" className="px-1">
            <FileText className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="links" title="Links" className="px-1">
            <LinkIcon className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="pinned" title="Pinned" className="px-1">
            <Pin className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="starred" title="Starred" className="px-1">
            <Star className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger value="search" title="Search" className="px-1">
            <Search className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="flex-1 overflow-y-auto px-2 py-3">
          <MediaTab conversationId={conversationId} />
        </TabsContent>
        <TabsContent value="files" className="flex-1 overflow-y-auto px-2 py-3">
          <FilesTab conversationId={conversationId} />
        </TabsContent>
        <TabsContent value="links" className="flex-1 overflow-y-auto px-2 py-3">
          <LinksTab conversationId={conversationId} />
        </TabsContent>
        <TabsContent value="pinned" className="flex-1 overflow-y-auto px-2 py-3">
          <PinnedTab conversationId={conversationId} onMessageClick={onMessageClick} />
        </TabsContent>
        <TabsContent value="starred" className="flex-1 overflow-y-auto px-2 py-3">
          <StarredTab onMessageClick={onMessageClick} />
        </TabsContent>
        <TabsContent value="search" className="flex-1 overflow-y-auto px-2 py-3">
          <SearchTab conversationId={conversationId} onMessageClick={onMessageClick} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MediaTab({ conversationId }: { conversationId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messagesApi.getConversationMedia(conversationId)
      .then((r) => setMessages(r.data as Message[]))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load media"))
      .finally(() => setLoading(false));
  }, [conversationId]);

  const mediaItems = messages
    .filter((m) => m.message_type === "image" || m.message_type === "video")
    .flatMap((m) =>
      Array.isArray(m.media)
        ? m.media.map((item) => ({ message: m, media: item }))
        : []
    );

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded" />
        ))}
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-6">No media shared yet.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-1">
      {mediaItems.map(({ message, media }, idx) => (
        <a
          key={`${message.id}-${idx}`}
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative aspect-square bg-muted rounded overflow-hidden group"
        >
          {media.type === "video" ? (
            <video src={media.url} className="w-full h-full object-cover" muted />
          ) : (
            <img
              src={media.url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
        </a>
      ))}
    </div>
  );
}

function FilesTab({ conversationId }: { conversationId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messagesApi.getConversationMedia(conversationId)
      .then((r) => setMessages(r.data as Message[]))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load files"))
      .finally(() => setLoading(false));
  }, [conversationId]);

  const files = messages
    .filter((m) => m.message_type === "file")
    .flatMap((m) =>
      Array.isArray(m.media)
        ? m.media.map((item) => ({ message: m, media: item }))
        : []
    );

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-6">No files shared yet.</p>;
  }

  return (
    <div className="space-y-2">
      {files.map(({ message, media }, idx) => (
        <a
          key={`${message.id}-${idx}`}
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors"
        >
          <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{media.name ?? "Attachment"}</p>
            <p className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(message.created_at)}
            </p>
          </div>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </a>
      ))}
    </div>
  );
}

function LinksTab({ conversationId }: { conversationId: number }) {
  const [links, setLinks] = useState<{ url: string; messageId: number; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messagesApi.getMessages(conversationId)
      .then((r) => {
        const all = r.data as Message[];
        const extracted = all.flatMap((m) => {
          if (!m.content) return [];
          const matches = m.content.match(URL_REGEX);
          return matches
            ? matches.map((url) => ({ url, messageId: m.id, createdAt: m.created_at }))
            : [];
        });
        setLinks(extracted);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load links"))
      .finally(() => setLoading(false));
  }, [conversationId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-6">No links shared yet.</p>;
  }

  return (
    <div className="space-y-2">
      {links.map((link, idx) => (
        <a
          key={`${link.messageId}-${idx}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors"
        >
          <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-primary truncate flex-1">{link.url}</span>
        </a>
      ))}
    </div>
  );
}

function PinnedTab({
  conversationId,
  onMessageClick,
}: {
  conversationId: number;
  onMessageClick?: (id: number) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messagesApi.getConversationPinnedMessages(conversationId)
      .then((r) => setMessages(r as Message[]))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load pinned"))
      .finally(() => setLoading(false));
  }, [conversationId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded" />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-6">No pinned messages.</p>;
  }

  return (
    <div className="space-y-2">
      {messages.map((msg) => (
        <MessageSnippet key={msg.id} msg={msg} onClick={onMessageClick} />
      ))}
    </div>
  );
}

function StarredTab({ onMessageClick }: { onMessageClick?: (id: number) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messagesApi.getStarredMessages()
      .then((r) => setMessages(r.data as Message[]))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load starred"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded" />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-6">No starred messages.</p>;
  }

  return (
    <div className="space-y-2">
      {messages.map((msg) => (
        <MessageSnippet key={msg.id} msg={msg} onClick={onMessageClick} />
      ))}
    </div>
  );
}

function SearchTab({
  conversationId,
  onMessageClick,
}: {
  conversationId: number;
  onMessageClick?: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await messagesApi.searchConversationMessages(conversationId, query.trim());
      setResults(res.data as Message[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [conversationId, query]);

  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          doSearch();
        }}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in conversation…"
          className="text-sm"
        />
        <Button type="submit" size="sm" disabled={loading || !query.trim()}>
          {loading ? "…" : "Go"}
        </Button>
      </form>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded" />
          ))}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-6">
          No messages matching &ldquo;{query}&rdquo;.
        </p>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          {results.map((msg) => (
            <MessageSnippet key={msg.id} msg={msg} onClick={onMessageClick} />
          ))}
        </div>
      )}
    </div>
  );
}

function MessageSnippet({
  msg,
  onClick,
}: {
  msg: Message;
  onClick?: (id: number) => void;
}) {
  // Backend handlers for pinned/favorites/search return messages with flat sender
  // fields (sender_username, sender_first_name, sender_last_name, sender_avatar)
  // instead of a nested `sender` object — consistent with `MessageBubble`.
  const flat = msg as unknown as {
    sender_first_name?: string;
    sender_last_name?: string;
    sender_avatar?: string;
  };
  const firstName = flat.sender_first_name ?? msg.sender?.first_name ?? "";
  const lastName = flat.sender_last_name ?? msg.sender?.last_name ?? "";
  const avatar = flat.sender_avatar ?? msg.sender?.avatar ?? "";

  return (
    <button
      type="button"
      onClick={() => onClick?.(msg.id)}
      className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex items-start gap-2"
    >
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={resolveAvatarUrl(avatar)} />
        <AvatarFallback>{firstName?.[0] ?? "?"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">
          {firstName} {lastName}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {msg.content || <span className="italic">[{msg.message_type}]</span>}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatDistanceToNow(msg.created_at)}
        </p>
      </div>
    </button>
  );
}
