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
      <div className="border rounded-xl p-4 bg-background hover:bg-muted/30 transition-colors space-y-2 group">
        {threadInfo.forum_name && (
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            {threadInfo.forum_name}
          </p>
        )}
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {threadInfo.title}
        </h3>
        {threadInfo.content && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {threadInfo.content}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {threadInfo.reply_count} replies
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {threadInfo.view_count} views
          </span>
          {(threadInfo.vote_count ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" />
              {threadInfo.vote_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
