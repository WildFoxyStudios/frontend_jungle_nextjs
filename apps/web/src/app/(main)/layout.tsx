import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { FloatingChat } from "@/components/chat/FloatingChat";
import { IncomingCallBanner } from "@/components/chat/IncomingCallBanner";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { GlobalKeyboardShortcuts } from "@/components/shared/GlobalKeyboardShortcuts";
import { Footer } from "@/components/layout/Footer";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <WebSocketProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <div className="flex flex-1 min-w-0">
            <main className="flex-1 pb-16 md:pb-0 min-w-0">
              {children}
              <Footer />
            </main>
            <RightSidebar />
          </div>
        </div>
      </div>
      <MobileNav />
      <FloatingChat />
      <IncomingCallBanner />
      <GlobalKeyboardShortcuts />
    </WebSocketProvider>
  );
}
