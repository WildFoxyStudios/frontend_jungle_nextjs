"use client";

import { useState } from "react";
import Link from "next/link";
import { groupsApi } from "@jungle/api-client";
import type { Group } from "@jungle/api-client";
import {
 HoverCard,
 HoverCardContent,
 HoverCardTrigger,
 Avatar,
 AvatarFallback,
 AvatarImage,
 Button,
 Badge,
} from "@jungle/ui";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface GroupHoverCardProps {
 /** Slug used to reach the backend `GET /v1/groups/{slug}` endpoint. */
 slug: string;
 children: React.ReactNode;
}

/**
 * Plan §3.16 HC1 — hoverable card showing a group's cover, name, member
 * count and a join/leave CTA. Data fetching is lazy: we only hit the
 * backend after the user hovers the trigger for the first time.
 */
export function GroupHoverCard({ slug, children }: GroupHoverCardProps) {
 const [group, setGroup] = useState<Group | null>(null);
 const [loading, setLoading] = useState(false);
 const [fetched, setFetched] = useState(false);
 const [isMember, setIsMember] = useState(false);
 const t = useTranslations("common");

 const handleOpen = (open: boolean) => {
 if (!open || fetched || !slug || slug === "undefined") return;
 setLoading(true);
 setFetched(true);
 groupsApi
 .getGroup(slug)
 .then((g) => {
 setGroup(g);
 setIsMember(Boolean(g.is_joined));
 })
 .catch((err) => { console.error("[GroupHoverCard] fetch failed", err); })
 .finally(() => setLoading(false));
 };

 const handleToggle = async () => {
 if (!group) return;
 try {
 if (isMember) {
 await groupsApi.leaveGroup(group.id);
 setIsMember(false);
 } else {
 await groupsApi.joinGroup(group.id);
 setIsMember(true);
 }
 } catch {
 toast.error("Action failed");
 }
 };

 return (
 <HoverCard onOpenChange={handleOpen} openDelay={300} closeDelay={200}>
 <HoverCardTrigger asChild>{children}</HoverCardTrigger>
 <HoverCardContent className="w-72 p-0 overflow-hidden" side="bottom" align="start">
 {loading ? (
 <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">
 {t("loading")}
 </div>
 ) : !group ? null : (
 <div>
 {group.cover && (
 // Cover image is optional; fall back to a plain spacer when missing.
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={group.cover}
 alt=""
 className="h-20 w-full object-cover"
 />
 )}
 <div className="p-4 space-y-3">
 <div className="flex items-start gap-3">
 <Avatar className="h-12 w-12 border-2 border-background">
 <AvatarImage src={group.avatar} />
 <AvatarFallback>{group.name?.[0]?.toUpperCase()}</AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <p className="font-semibold text-sm truncate">{group.name}</p>
 {group.category && (
 <Badge variant="secondary" className="text-[10px] px-2 py-0 h-5 mt-1">
 {group.category}
 </Badge>
 )}
 </div>
 </div>

 {group.description && (
 <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
 {group.description}
 </p>
 )}

 <div className="flex items-center gap-2 text-xs text-muted-foreground">
 <Users className="h-3.5 w-3.5" />
 <span>
 <strong className="text-foreground">
 {(group.member_count ?? 0).toLocaleString()}
 </strong>{" "}
 members
 </span>
 </div>

 <div className="flex gap-2 pt-1">
 <Button
 size="sm"
 className="h-9 flex-1 rounded-full text-[13px] font-semibold"
 onClick={handleToggle}
 >
 {isMember ? "Leave" : "Join"}
 </Button>
 <Button
 size="sm"
 variant="outline"
 className="h-9 flex-1 rounded-full text-[13px] font-semibold"
 asChild
 >
 <Link href={`/groups/${group.name ?? slug}`}>Visit</Link>
 </Button>
 </div>
 </div>
 </div>
 )}
 </HoverCardContent>
 </HoverCard>
 );
}
