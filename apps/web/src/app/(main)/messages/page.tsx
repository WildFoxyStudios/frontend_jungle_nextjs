"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { messagesApi } from "@jungle/api-client";
import type { Conversation } from "@jungle/api-client";
import { Avatar, AvatarFallback, AvatarImage, Badge, Skeleton } from "@jungle/ui";
import { useAuthStore } from "@jungle/hooks";
import { EmptyState } from "@/components/shared/EmptyState";
import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    messagesApi.getConversations()
      .then((r) => setConversations(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <div className="divide-y">
          {conversations.map((conv) => {
            const other = conv.members.find((m) => m.user.id !== user?.id)?.user;
            return (
              <Link key={conv.id} href={`/messages/${conv.id}`} className="flex items-center gap-3 py-3 hover:bg-muted/50 px-2 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conv.avatar ?? other?.avatar} />
                  <AvatarFallback>{(conv.name ?? other?.first_name ?? "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate">{conv.name ?? `${other?.first_name} ${other?.last_name}`}</p>
                    {conv.unread_count > 0 && <Badge variant="destructive" className="text-xs">{conv.unread_count}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.last_message?.content}</p>
                </div>
              </Link>
            );
          })}
          {conversations.length === 0 && (
            <EmptyState icon={MessageCircle} title="No conversations yet" description="Start a conversation by messaging someone." />
          )}
        </div>
      )}
    </div>
  );
}
