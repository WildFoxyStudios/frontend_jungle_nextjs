"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { eventsApi } from "@jungle/api-client";
import type { Event, Post, PublicUser } from "@jungle/api-client";
import {
 Button, Skeleton, Avatar, AvatarImage, AvatarFallback,
 Tabs, TabsList, TabsTrigger, TabsContent, Card, CardContent, Separator,
} from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";
import { firstHeroImagePostId } from "@/lib/feed-lcp";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
 MapPin,
 Calendar,
 Clock,
 Users,
 UserCheck,
 Star,
 CheckCircle2,
 UserPlus,
 CalendarPlus,
 ExternalLink,
} from "lucide-react";
import { googleMapsLatLng, googleMapsSearchQuery } from "@/lib/map-links";
import { MapView } from "@/components/shared/MapView";
import { InviteFriendsDialog } from "@/components/shared/InviteFriendsDialog";

interface Props { id: string }

export function EventClient({ id }: Props) {
 const tc = useTranslations("common");
 const [event, setEvent] = useState<Event | null>(null);
 const [posts, setPosts] = useState<Post[]>([]);
 const [going, setGoing] = useState<PublicUser[]>([]);
 const [interested, setInterested] = useState<PublicUser[]>([]);
 const [activeTab, setActiveTab] = useState("about");
 const [myResponse, setMyResponse] = useState<string | undefined>();

 useEffect(() => {
 eventsApi.getEvent(Number(id)).then((e) => {
 setEvent(e);
 setMyResponse(e.my_response);
 }).catch(() => toast.error("Failed to load event"));
 }, [id]);

 useEffect(() => {
 if (!event) return;
 if (activeTab === "posts" && posts.length === 0) {
 eventsApi.getEventPosts(event.id)
 .then((r) => setPosts(Array.isArray(r?.data) ? r.data : []))
 .catch(() => toast.error("Failed to load posts"));
 }
 if (activeTab === "going" && going.length === 0) {
 eventsApi.getGoing(event.id)
 .then((r) => setGoing(Array.isArray(r?.data) ? r.data : []))
 .catch(() => toast.error("Failed to load going list"));
 }
 if (activeTab === "interested" && interested.length === 0) {
 eventsApi.getInterested(event.id)
 .then((r) => setInterested(Array.isArray(r?.data) ? r.data : []))
 .catch(() => toast.error("Failed to load interested list"));
 }
 }, [event, activeTab, posts.length, going.length, interested.length]);

 const handleRespond = async (response: "going" | "interested" | "not_going") => {
 if (!event) return;
 try {
 await eventsApi.respondEvent(event.id, response);
 setMyResponse(response);
 toast.success(response === "going" ? "You're going!" : response === "interested" ? "Marked as interested" : "Response updated");
 } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
 };

 if (!event) return <Skeleton className="h-64 w-full max-w-2xl mx-auto mt-4" />;

 const startDate = new Date(event.start_date);
 const endDate = new Date(event.end_date);
 const eventPostsLcpId = firstHeroImagePostId(posts);
 const hasEventCoords =
 event.latitude != null &&
 event.longitude != null &&
 Number.isFinite(event.latitude) &&
 Number.isFinite(event.longitude);

 return (
 <div className="max-w-2xl mx-auto">
 {/* Cover */}
 {event.cover && (
 <div className="relative h-48 overflow-hidden border bg-muted">
 <Image src={event.cover} alt="" fill priority unoptimized className="object-cover" />
 </div>
 )}

 <div className="space-y-4 px-3 py-4 sm:px-4">
 {/* Header */}
 <div className="space-y-2">
 <p className="text-[15px] font-semibold text-primary">
 {startDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
 </p>
 <h1 className="text-2xl font-bold sm:text-[28px]">{event.title}</h1>
 <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
 <span className="flex items-center gap-1">
 <Calendar className="h-3.5 w-3.5" />
 {startDate.toLocaleDateString()} — {endDate.toLocaleDateString()}
 </span>
 <span className="flex items-center gap-1">
 <Clock className="h-3.5 w-3.5" />
 {startDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
 </span>
 {event.location && (
 <span className="flex items-center gap-1">
 <MapPin className="h-3.5 w-3.5" /> {event.location}
 </span>
 )}
 </div>
 <div className="flex items-center gap-4 text-sm text-muted-foreground">
 <span className="flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" /> {event.going_count} going</span>
 <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" /> {event.interested_count} interested</span>
 </div>
 </div>

 {/* RSVP buttons */}
 <div className="flex gap-2">
 <Button
 onClick={() => handleRespond("going")}
 variant={myResponse === "going" ? "default" : "outline"}
 className="gap-1.5"
 >
 {myResponse === "going" && <CheckCircle2 className="h-3.5 w-3.5" />}
 Going
 </Button>
 <Button
 onClick={() => handleRespond("interested")}
 variant={myResponse === "interested" ? "default" : "outline"}
 className="gap-1.5"
 >
 {myResponse === "interested" && <CheckCircle2 className="h-3.5 w-3.5" />}
 Interested
 </Button>
 <Button variant="ghost" onClick={() => handleRespond("not_going")}>
 Not going
 </Button>
 <InviteFriendsDialog onInvite={(ids) => eventsApi.inviteUsers(event.id, ids)}>
 <Button variant="outline" className="gap-1.5">
 <UserPlus className="h-3.5 w-3.5" /> Invite
 </Button>
 </InviteFriendsDialog>
 {/* Plan §3.5 E1 — export the event to the user's calendar. The
 backend generates an RFC-5545 `.ics` file on the fly. */}
 <Button asChild variant="outline" className="gap-1.5">
 <a
 href={eventsApi.icsUrl(event.id)}
 download={`event-${event.id}.ics`}
 rel="noopener noreferrer"
 >
 <CalendarPlus className="h-3.5 w-3.5" /> Add to calendar
 </a>
 </Button>
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <TabsList className="w-full justify-start">
 <TabsTrigger value="about">About</TabsTrigger>
 <TabsTrigger value="posts">Posts</TabsTrigger>
 <TabsTrigger value="going">Going ({event.going_count})</TabsTrigger>
 <TabsTrigger value="interested">Interested ({event.interested_count})</TabsTrigger>
 </TabsList>

 <TabsContent value="about" className="mt-4">
 <Card>
 <CardContent className="p-4 space-y-4">
 <h3 className="font-semibold text-sm">Details</h3>
 <Separator />
 {event.description && <p className="text-sm whitespace-pre-wrap">{event.description}</p>}
 <div className="grid gap-3 text-sm">
 <div className="flex items-center gap-2 text-muted-foreground">
 <Calendar className="h-4 w-4" />
 <div>
 <p className="font-medium text-foreground">{startDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
 <p className="text-xs">
 {startDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} —{" "}
 {endDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
 </p>
 </div>
 </div>
 {event.location && (
 <div className="flex items-center gap-2 text-muted-foreground">
 <MapPin className="h-4 w-4 shrink-0" />
 <span>{event.location}</span>
 </div>
 )}
 {hasEventCoords && (
 <div className="space-y-2 pt-2">
 <MapView
 className="h-[220px] w-full min-h-[12rem]"
 center={[event.latitude!, event.longitude!]}
 zoom={13}
 markers={[
 {
 id: "event",
 lat: event.latitude!,
 lng: event.longitude!,
 label: event.title,
 },
 ]}
 />
 <Button variant="outline" size="sm" className="gap-2" asChild>
 <a
 href={googleMapsLatLng(event.latitude!, event.longitude!)}
 target="_blank"
 rel="noopener noreferrer"
 >
 <ExternalLink className="h-3.5 w-3.5" aria-hidden />
 {tc("openInGoogleMaps")}
 </a>
 </Button>
 </div>
 )}
 {!hasEventCoords && !!event.location?.trim() && (
 <Button variant="outline" size="sm" className="gap-2" asChild>
 <a
 href={googleMapsSearchQuery(event.location)}
 target="_blank"
 rel="noopener noreferrer"
 >
 <ExternalLink className="h-3.5 w-3.5" aria-hidden />
 {tc("openInGoogleMaps")}
 </a>
 </Button>
 )}
 </div>
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="posts" className="space-y-4 mt-4">
 {posts.length === 0
 ? (
 <div className="py-12 text-center">
 <p className="font-medium text-muted-foreground">No posts yet.</p>
 </div>
 )
 : posts.map((p) => (
 <PostCard
 key={p.id}
 post={p}
 priority={eventPostsLcpId !== null && p.id === eventPostsLcpId}
 />
 ))
 }
 </TabsContent>

 <TabsContent value="going" className="mt-4 space-y-3">
 <UserGrid users={going} />
 <Link href={`/events/${id}/attendees`} className="text-sm text-primary hover:underline flex items-center gap-1">
 <Users className="h-3.5 w-3.5" /> View all attendees
 </Link>
 </TabsContent>

 <TabsContent value="interested" className="mt-4 space-y-3">
 <UserGrid users={interested} />
 <Link href={`/events/${id}/attendees`} className="text-sm text-primary hover:underline flex items-center gap-1">
 <Users className="h-3.5 w-3.5" /> View all attendees
 </Link>
 </TabsContent>
 </Tabs>
 </div>
 </div>
 );
}

function UserGrid({ users }: { users: PublicUser[] }) {
 if (users.length === 0) {
 return (
 <div className="py-12 text-center">
 <p className="font-medium text-muted-foreground">No one yet.</p>
 </div>
 );
 }
 return (
 <div className="grid grid-cols-2 gap-2">
 {users.map((u) => (
 <Link key={u.id} href={`/profile/${u.username}`} className="flex items-center gap-2 p-2 transition-colors hover:bg-muted/50">
 <Avatar className="h-10 w-10">
 <AvatarImage src={resolveAvatarUrl(u.avatar)} />
 <AvatarFallback>{u.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 <div className="min-w-0">
 <p className="text-sm font-medium truncate">{u.first_name} {u.last_name}</p>
 <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
 </div>
 </Link>
 ))}
 </div>
 );
}
