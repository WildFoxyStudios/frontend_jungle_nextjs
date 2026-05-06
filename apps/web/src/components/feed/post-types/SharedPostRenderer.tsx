import Image from "next/image";
import Link from "next/link";
import type { Post } from "@jungle/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";
import { formatDistanceToNow } from "@/lib/date";
import { PostContent } from "../PostContent";
import { RichUrlPreviewEmbed } from "./RichUrlPreviewEmbed";

interface SharedPostRendererProps {
 sharedPost: Post | null | undefined;
}

export function SharedPostRenderer({ sharedPost }: SharedPostRendererProps) {
 if (!sharedPost) return null;

 const pub = sharedPost.publisher || {
 username: "unknown",
 first_name: "User",
 last_name: "",
 avatar: "",
 };
 const previewMedia = (sharedPost.media ?? [])
 .map((item) => {
 const raw = item as unknown as Record<string, unknown>;
 return {
 ...item,
 url: item.url ?? (raw.file_url as string) ?? "",
 type: item.type ?? (raw.file_type as "image" | "video" | "audio" | "file") ?? "image",
 };
 })
 .find((item) => !!item.url && (item.type === "image" || item.type === "video"));

 return (
 <div className="space-y-3 border rounded-md bg-secondary/40 p-3 md:p-4">
 <div className="flex items-start gap-3">
 <Link href={`/profile/${pub.username}`} className="shrink-0">
 <Avatar className="h-9 w-9 border">
 <AvatarImage src={resolveAvatarUrl(pub.avatar)} />
 <AvatarFallback>{pub.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 </Link>
 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-1.5">
 <Link href={`/profile/${pub.username}`} className="truncate text-sm font-semibold hover:underline">
 {pub.first_name} {pub.last_name}
 </Link>
 <span className="text-[10px] text-muted-foreground">
 {formatDistanceToNow(sharedPost.created_at)}
 </span>
 </div>
 <div className="mt-1">
 <Link
 href={`/post/${sharedPost.id}`}
 className="inline-flex items-center rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-primary"
 >
 Open original post
 </Link>
 </div>
 </div>
 </div>

 {sharedPost.content && (
 <div className="text-sm">
 <PostContent text={sharedPost.content} />
 </div>
 )}

 {previewMedia && (
 <div className="overflow-hidden border rounded-lg bg-card">
 {previewMedia.type === "video" ? (
 <video
 src={previewMedia.url}
 className="h-auto max-h-72 w-full object-cover"
 muted
 playsInline
 />
 ) : (
 <Image
 src={previewMedia.url}
 alt=""
 width={1200}
 height={800}
 unoptimized
 className="h-auto max-h-72 w-full object-cover"
 />
 )}
 </div>
 )}

 {sharedPost.link_url && !sharedPost.blog_info && !sharedPost.product_info && (
 <RichUrlPreviewEmbed
 url={sharedPost.link_url}
 title={sharedPost.link_title}
 description={sharedPost.link_description}
 image={sharedPost.link_image}
 />
 )}
 </div>
 );
}
