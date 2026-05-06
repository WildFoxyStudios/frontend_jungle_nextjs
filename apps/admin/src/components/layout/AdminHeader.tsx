"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Button,
  TopbarShell,
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@jungle/ui";
import { authApi } from "@jungle/api-client";
import { api } from "@jungle/api-client";
import { useRouter } from "next/navigation";
import { LogOut, ChevronRight, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminNavPanel } from "./AdminNavPanel";

const ADMIN_TOKEN_COOKIE = "Jungle_admin_token";

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("admin");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const breadcrumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((segment, i, arr) => ({
      label: segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: "/" + arr.slice(0, i + 1).join("/"),
    }));

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    api.clearToken();
    document.cookie = "Jungle_logged_in=; path=/; max-age=0";
    document.cookie = "Jungle_is_admin=; path=/; max-age=0";
    document.cookie = `${ADMIN_TOKEN_COOKIE}=; path=/; max-age=0`;
    router.push("/login");
  };

  return (
    <TopbarShell>
      <div className="flex h-14 items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 border md:hidden"
              aria-label="Admin menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex w-[min(100vw-0.5rem,22rem)] max-w-[100vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-sm"
          >
            <SheetTitle className="sr-only">{t("appTitle")}</SheetTitle>
            <div className="shrink-0 border-b bg-secondary px-4 py-3">
              <Link
                href="/"
                className="block text-lg font-black uppercase tracking-tight text-secondary-foreground"
                onClick={() => setMobileNavOpen(false)}
              >
                {t("appTitle")}
              </Link>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <AdminNavPanel onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground sm:text-sm"
        >
          <span className="text-foreground">Admin</span>
          {breadcrumbs.map((b, i) => (
            <span key={b.href} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span
                className={
                  i === breadcrumbs.length - 1 ? "text-foreground" : "text-muted-foreground"
                }
              >
                {b.label}
              </span>
            </span>
          ))}
        </nav>
        <Button variant="outline" size="sm" className="shrink-0" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </TopbarShell>
  );
}
