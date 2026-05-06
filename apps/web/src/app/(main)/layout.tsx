import type { ReactNode } from "react";
import { AppShell } from "@jungle/ui";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { IncomingCallBanner } from "@/components/chat/IncomingCallBanner";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { GlobalKeyboardShortcuts } from "@/components/shared/GlobalKeyboardShortcuts";
import { Footer } from "@/components/layout/Footer";
import { SkipToMainContent } from "@/components/layout/SkipToMainContent";
import { AuthInitializer } from "@/components/layout/AuthInitializer";

export default function MainLayout({ children }: { children: ReactNode }) {
 return (
 <WebSocketProvider>
 <AuthInitializer />
 <SkipToMainContent />
 <AppShell
 sidebar={<Sidebar />}
 topbar={<Header />}
 rightRail={<RightSidebar />}
 overlays={
 <>
 <IncomingCallBanner />
 <GlobalKeyboardShortcuts />
 </>
 }
 >
 {children}
 <Footer />
 </AppShell>
 </WebSocketProvider>
 );
}
