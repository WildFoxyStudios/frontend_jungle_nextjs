import Link from "next/link";
import { MessageSquare, Eye, ThumbsUp } from "lucide-react";

interface ForumThreadEmbedProps {
 threadInfo: {
 id: number;
 title: string;
 content?: string;
 reply_count: number;
 view_count: number;
 vote_count?: number;
 forum_name?: string;
 };
}

export function ForumThreadEmbed({ threadInfo }: ForumThreadEmbedProps) {
 return (
 <Link href={`/forums/threads/${threadInfo.id}`}>
 <div className="group space-y-3 border rounded-lg bg-card p-4 transition-colors hover:bg-secondary/60">
 {threadInfo.forum_name && (
 <p className="text-xs font-medium text-muted-foreground">
 {threadInfo.forum_name}
 </p>
 )}
 <h3 className="line-clamp-2 text-sm font-semibold transition-colors group-hover:text-primary">
 {threadInfo.title}
 </h3>
 {threadInfo.content && (
 <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
 {threadInfo.content}
 </p>
 )}
 <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
 <span className="inline-flex items-center gap-1 border rounded-md bg-secondary/40 px-2.5 py-1 text-[13px] font-medium">
 <MessageSquare className="h-3.5 w-3.5" />
 {threadInfo.reply_count} replies
 </span>
 <span className="inline-flex items-center gap-1 border rounded-md bg-secondary/40 px-2.5 py-1 text-[13px] font-medium">
 <Eye className="h-3.5 w-3.5" />
 {threadInfo.view_count} views
 </span>
 {(threadInfo.vote_count ?? 0) > 0 && (
 <span className="inline-flex items-center gap-1 border rounded-md bg-secondary/40 px-2.5 py-1 text-[13px] font-medium">
 <ThumbsUp className="h-3.5 w-3.5" />
 {threadInfo.vote_count}
 </span>
 )}
 </div>
 </div>
 </Link>
 );
}
