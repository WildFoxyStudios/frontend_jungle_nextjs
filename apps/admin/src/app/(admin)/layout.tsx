import type { ReactNode } from "react";
import { PageContainer } from "@jungle/ui";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";

/**
 * Admin uses its own shell: `AppShell` hides the sidebar below `md`, which
 * removed the entire settings nav on tablet/phone. Desktop keeps the
 * column; below `md` the header menu (Sheet) lists the same links.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full text-foreground">
      <aside className="hidden shrink-0 md:block">
        <AdminSidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <PageContainer size="full" className="flex-1">
          {children}
        </PageContainer>
      </div>
    </div>
  );
}
