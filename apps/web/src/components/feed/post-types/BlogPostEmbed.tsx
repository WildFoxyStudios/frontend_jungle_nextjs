import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";

interface BlogPostEmbedProps {
 blogInfo: { id: number; title: string; description: string; thumbnail: string; url: string };
}

export function BlogPostEmbed({ blogInfo }: BlogPostEmbedProps) {
 return (
 <Link
 href={blogInfo.url || `/blog/${blogInfo.id}`}
 className="group block overflow-hidden border rounded-lg bg-card transition-colors hover:bg-secondary/60"
 >
 <div className={blogInfo.thumbnail ? "md:flex" : ""}>
 {blogInfo.thumbnail ? (
 <div className="relative aspect-[2/1] bg-muted md:aspect-auto md:w-[220px] md:shrink-0">
 <Image
 src={blogInfo.thumbnail}
 alt=""
 fill
 unoptimized
 className="object-cover transition-transform duration-500 group-hover:scale-105"
 />
 </div>
 ) : (
 <div className="flex items-center gap-1 bg-muted p-3 text-xs font-semibold md:w-[220px] md:shrink-0">
 <BookOpen className="h-3 w-3" /> Blog Article
 </div>
 )}
 <div className="space-y-2 p-4">
 <div className="inline-flex items-center gap-1 border rounded-md bg-secondary/40 px-2.5 py-1 text-[13px] font-medium text-muted-foreground">
 <BookOpen className="h-3 w-3" />
 Blog
 </div>
 <h3 className="line-clamp-2 text-lg font-semibold leading-6 group-hover:text-primary">
 {blogInfo.title}
 </h3>
 <p className="line-clamp-3 text-sm text-muted-foreground">{blogInfo.description}</p>
 </div>
 </div>
 </Link>
 );
}
