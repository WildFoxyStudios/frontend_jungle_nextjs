import Link from "next/link";
import { BookOpen } from "lucide-react";

interface BlogPostEmbedProps {
  blogInfo: { id: number; title: string; description: string; thumbnail: string; url: string };
}

export function BlogPostEmbed({ blogInfo }: BlogPostEmbedProps) {
  return (
    <Link href={blogInfo.url || `/blog/${blogInfo.id}`} className="block border rounded-xl overflow-hidden bg-background hover:bg-muted/30 transition-colors group">
      {blogInfo.thumbnail ? (
        <div className="relative aspect-[2/1] bg-muted">
          <img src={blogInfo.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute top-2 left-2 bg-background/90 backdrop-blur text-foreground px-2 py-1 flex items-center gap-1 rounded-md text-xs font-semibold shadow-sm">
            <BookOpen className="w-3 h-3" /> Blog
          </div>
        </div>
      ) : (
        <div className="bg-muted p-2 flex items-center gap-1 text-xs font-semibold">
          <BookOpen className="w-3 h-3" /> Blog Article
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:underline">{blogInfo.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{blogInfo.description}</p>
      </div>
    </Link>
  );
}
