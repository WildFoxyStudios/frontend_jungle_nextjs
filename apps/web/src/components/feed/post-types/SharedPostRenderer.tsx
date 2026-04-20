import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";
import { formatDistanceToNow } from "@/lib/date";
import { PostContent } from "../PostContent";

interface SharedPostRendererProps {
  sharedPost: any; // Type 'Post' from @jungle/api-client
}

export function SharedPostRenderer({ sharedPost }: SharedPostRendererProps) {
  if (!sharedPost) return null;

  const pub = sharedPost.publisher || {
    username: "unknown",
    first_name: "User",
    last_name: "",
    avatar: "",
  };

  return (
    <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
      <div className="flex items-center gap-2">
        <Link href={`/profile/${pub.username}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={resolveAvatarUrl(pub.avatar)} />
            <AvatarFallback>{pub.first_name?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-col">
          <Link href={`/profile/${pub.username}`} className="font-semibold text-xs hover:underline">
            {pub.first_name} {pub.last_name}
          </Link>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(sharedPost.created_at)}
          </span>
        </div>
      </div>

      {sharedPost.content && (
        <div className="text-sm">
          <PostContent text={sharedPost.content} />
        </div>
      )}

      {/* Note: In a real recursive scenario, we'd handle media here too, 
          but usually we limit shared depth to 1 for sanity/UI constraints. */}
      {sharedPost.media && sharedPost.media.length > 0 && (
        <div className="rounded-lg overflow-hidden border">
          {/* Simplified media display for shared post */}
          <img
            src={sharedPost.media[0].url}
            alt=""
            className="w-full h-auto max-h-60 object-cover"
          />
        </div>
      )}
    </div>
  );
}
