"use client";

import { useState } from "react";
import Link from "next/link";
import { usersApi } from "@jungle/api-client";
import {
  HoverCard, HoverCardContent, HoverCardTrigger,
  Avatar, AvatarFallback, AvatarImage, Button, Badge,
} from "@jungle/ui";
import { useAuthStore } from "@jungle/hooks";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

interface UserHoverCardProps {
  username: string;
  children: React.ReactNode;
}

/** Minimal profile fields needed by the hover card — matches `/v1/users/{username}/popover`. */
interface PopoverProfile {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  about: string | null;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  post_count: number;
  is_following: boolean;
}

export function UserHoverCard({ username, children }: UserHoverCardProps) {
  const { user: me } = useAuthStore();
  const [profile, setProfile] = useState<PopoverProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [fetched, setFetched] = useState(false);
  const tc = useTranslations("common");
  const tn = useTranslations("nav");
  const tp = useTranslations("profile");

  const handleOpen = (open: boolean) => {
    if (open && !fetched && username && username !== "undefined") {
      setLoading(true);
      setFetched(true);
      usersApi
        .getPopover(username)
        .then((u) => {
          setProfile(u);
          setIsFollowing(u.is_following ?? false);
        })
        .catch(() => { /* non-critical: failure is silent */ })
        .finally(() => setLoading(false));
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    try {
      if (isFollowing) {
        await usersApi.unfollow(profile.id);
        setIsFollowing(false);
      } else {
        await usersApi.follow(profile.id);
        setIsFollowing(true);
      }
    } catch {
      toast.error("Action failed");
    }
  };

  const isMe = me?.id === profile?.id;

  return (
    <HoverCard onOpenChange={handleOpen} openDelay={300} closeDelay={200}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-72 p-0" side="bottom" align="start">
        {loading ? (
          <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">{tc("loading")}</div>
        ) : !profile ? null : (
          <div className="p-4 space-y-4 w-72">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                  <AvatarImage src={resolveAvatarUrl(profile.avatar ?? "")} />
                  <AvatarFallback>{profile.first_name?.[0] ?? profile.username?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-sm truncate max-w-[120px]">{profile.first_name} {profile.last_name}</span>
                    {profile.is_verified && <Sparkles className="h-3 w-3 text-primary fill-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">@{profile.username}</p>
                </div>
              </div>
              {!isMe && isFollowing ? (
                <Badge variant="secondary" className="px-2 py-0 h-6 text-[10px] font-bold uppercase">{tn("friends")}</Badge>
              ) : null}
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{profile.about || tp("noBio")}</p>

            <div className="flex gap-4 text-xs">
              <span className="text-muted-foreground"><strong className="text-foreground">{profile.follower_count ?? 0}</strong> {tp("followers")}</span>
              <span className="text-muted-foreground"><strong className="text-foreground">{profile.following_count ?? 0}</strong> {tp("following")}</span>
              <span className="text-muted-foreground"><strong className="text-foreground">{profile.post_count ?? 0}</strong> {tp("posts")}</span>
            </div>

            {!isMe && (
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1 rounded-xl h-9 font-bold text-[11px]" onClick={handleFollow}>
                  {isFollowing ? tp("unfollow") : tp("follow")}
                </Button>
                <Button size="sm" variant="outline" className="flex-1 rounded-xl h-9 font-bold text-[11px]" asChild>
                  <Link href={`/messages?user=${profile.username}`}>{tp("message")}</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
