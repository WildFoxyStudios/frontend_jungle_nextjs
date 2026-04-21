"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { messagesApi } from "@jungle/api-client";
import type { Conversation } from "@jungle/api-client";
import {
  Avatar, AvatarFallback, AvatarImage, Badge, Skeleton, Button, Input,
} from "@jungle/ui";
import { useAuthStore } from "@jungle/hooks";
import { EmptyState } from "@/components/shared/EmptyState";
import { InviteFriendsDialog } from "@/components/shared/InviteFriendsDialog";
import { MessageCircle, Search, Users, Megaphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const t = useTranslations("messages");

  useEffect(() => {
    messagesApi.getConversations()
      .then((r) => setConversations(r.data))
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? conversations.filter((c) => {
        const other = c.members.find((m) => m.user.id !== user?.id)?.user;
        const name = c.name ?? `${other?.first_name} ${other?.last_name}`;
        return name.toLowerCase().includes(search.toLowerCase());
      })
    : conversations;

  const handleCreateGroup = async (memberIds: number[]) => {
    try {
      const conv = await messagesApi.createGroupConversation({ name: "Group Chat", member_ids: memberIds });
      toast.success("Group created");
      router.push(`/messages/${conv.id}`);
    } catch {
      toast.error("Failed to create group");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href="/messages/broadcasts"><Megaphone className="h-3.5 w-3.5" /> Broadcasts</Link>
          </Button>
          <InviteFriendsDialog
            title="New Group Chat"
            onInvite={handleCreateGroup}
          >
            <Button variant="outline" size="sm" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> New Group
            </Button>
          </InviteFriendsDialog>
        </div>
      </div>

      {/* Search conversations */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <div className="divide-y">
          {filtered.map((conv) => {
            const other = conv.members.find((m) => m.user.id !== user?.id)?.user;
            return (
              <Link key={conv.id} href={`/messages/${conv.id}`} className="flex items-center gap-3 py-3 hover:bg-muted/50 px-2 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conv.avatar ?? other?.avatar} />
                  <AvatarFallback>{(conv.name ?? other?.first_name ?? "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm truncate">{conv.name ?? `${other?.first_name} ${other?.last_name}`}</p>
                      {conv.type === "group" && <Badge variant="secondary" className="text-[10px]">Group</Badge>}
                    </div>
                    {conv.unread_count > 0 && <Badge variant="destructive" className="text-xs">{conv.unread_count}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.last_message?.content}</p>
                </div>
              </Link>
            );
          })}
          {filtered.length === 0 && !search && (
            <EmptyState icon={MessageCircle} title={t("noConversations")} description={t("newMessage")} />
          )}
          {filtered.length === 0 && search && (
            <p className="text-sm text-center text-muted-foreground py-8">No conversations match &quot;{search}&quot;</p>
          )}
        </div>
      )}
    </div>
  );
}
