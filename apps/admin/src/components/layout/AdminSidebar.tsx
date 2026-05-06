"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SidebarShell } from "@jungle/ui";
import { AdminNavPanel } from "./AdminNavPanel";

export function AdminSidebar() {
  const t = useTranslations("admin");

  return (
    <SidebarShell width="md">
      <div className="border-b border-border surface-raised px-4 py-4">
        <Link
          href="/"
          className="block text-xl font-black uppercase tracking-tight text-secondary-foreground"
        >
          {t("appTitle")}
        </Link>
      </div>
      <AdminNavPanel />
    </SidebarShell>
  );
}
