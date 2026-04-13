import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { WebSocketProvider } from "@/providers/WebSocketProvider";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <WebSocketProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <AnnouncementBanner />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
        </div>
      </div>
      <MobileNav />
    </WebSocketProvider>
  );
}
