"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { ChatWindow } from "@/components/chat/ChatWindow";

interface Props { params: Promise<{ conversationId: string }> }

export default function ConversationPage({ params }: Props) {
 const { conversationId } = use(params);
 const searchParams = useSearchParams();
 // Plan §3.1 — C9: `?reply_story=<story_id>` opens the chat with a banner
 // prepopulated from the referenced story.
 const rawStoryId = searchParams.get("reply_story");
 const storyReplyId = rawStoryId ? Number(rawStoryId) : undefined;

 return (
 // dvh follows the visible viewport (collapses with the iOS keyboard /
 // address bar). Keeps a vh fallback for very old Safari builds.
 <div className="h-[calc(100vh-3.5rem)] h-[calc(100dvh-3.5rem)]">
 <ChatWindow
 conversationId={Number(conversationId)}
 storyReplyId={Number.isFinite(storyReplyId) ? storyReplyId : undefined}
 />
 </div>
 );
}
