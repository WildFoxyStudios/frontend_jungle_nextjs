"use client";

import { use } from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";

interface Props { params: Promise<{ conversationId: string }> }

export default function ConversationPage({ params }: Props) {
  const { conversationId } = use(params);
  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <ChatWindow conversationId={Number(conversationId)} />
    </div>
  );
}
