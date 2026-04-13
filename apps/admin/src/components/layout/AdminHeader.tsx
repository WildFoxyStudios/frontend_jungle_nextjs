"use client";

import { usePathname } from "next/navigation";
import { Button } from "@jungle/ui";
import { authApi } from "@jungle/api-client";
import { api } from "@jungle/api-client";
import { useRouter } from "next/navigation";

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const breadcrumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((segment, i, arr) => ({
      label: segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: "/" + arr.slice(0, i + 1).join("/"),
    }));

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    api.clearToken();
    router.push("/login");
  };

  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-background">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span className="text-foreground font-medium">Admin</span>
        {breadcrumbs.map((b, i) => (
          <span key={b.href} className="flex items-center gap-1">
            <span>/</span>
            <span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
              {b.label}
            </span>
          </span>
        ))}
      </nav>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Logout
      </Button>
    </header>
  );
}
