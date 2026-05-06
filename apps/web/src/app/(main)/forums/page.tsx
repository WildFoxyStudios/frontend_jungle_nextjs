"use client";

import { useEffect, useState } from "react";
import { contentApi } from "@jungle/api-client";
import type { ForumSection } from "@jungle/api-client";
import { Card, CardContent, Skeleton, Badge } from "@jungle/ui";
import Link from "next/link";
import { MessageSquare, ChevronRight } from "lucide-react";

export default function ForumsPage() {
 const [sections, setSections] = useState<ForumSection[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 contentApi.getForumSections()
 .then(setSections)
 .catch((err) => { console.error("[ForumsPage] getForumSections failed", err); })
 .finally(() => setLoading(false));
 }, []);

 if (loading) return (
 <div className="mx-auto max-w-4xl space-y-4 px-3 py-4 sm:px-4">
 {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
 </div>
 );

 return (
 <div className="mx-auto max-w-4xl space-y-6 px-3 py-4 sm:px-4">
 <div className="flex items-center gap-2">
 <MessageSquare className="h-6 w-6" />
 <h1 className="text-2xl font-bold sm:text-[28px]">Forums</h1>
 </div>

 {sections.length === 0 && (
 <div className="py-12 text-center">
 <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
 <p className="font-medium text-muted-foreground">No forum sections yet.</p>
 </div>
 )}

 {sections.map((section) => (
 <div key={section.id} className="space-y-2">
 <h2 className="text-sm font-semibold text-muted-foreground">{section.name}</h2>
 {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
 <div className="space-y-2">
 {section.forums?.map((forum) => (
 <Link key={forum.id} href={`/forums/${forum.id}`}>
 <Card className="cursor-pointer transition-colors hover:bg-muted/50">
 <CardContent className="p-4 flex items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-primary text-primary-foreground">
 <MessageSquare className="h-5 w-5" />
 </div>
 <div>
 <p className="font-semibold">{forum.name}</p>
 {forum.description && <p className="text-sm text-muted-foreground">{forum.description}</p>}
 <div className="flex items-center gap-3 mt-1">
 <Badge variant="secondary" className="text-xs">{forum.thread_count} threads</Badge>
 {forum.last_post_at && (
 <span className="text-[13px] font-medium text-muted-foreground">
 Last post {new Date(forum.last_post_at).toLocaleDateString()}
 </span>
 )}
 </div>
 </div>
 </div>
 <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
 </CardContent>
 </Card>
 </Link>
 ))}
 </div>
 </div>
 ))}
 </div>
 );
}
