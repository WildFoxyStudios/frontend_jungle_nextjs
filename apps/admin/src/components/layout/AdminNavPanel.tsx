"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ADMIN_NAV_GROUPS, adminNavItemKey } from "@/config/admin-nav-groups";

interface AdminNavPanelProps {
  /** Close mobile sheet after navigation. */
  onNavigate?: () => void;
  className?: string;
}

export function AdminNavPanel({ onNavigate, className }: AdminNavPanelProps) {
  const pathname = usePathname();
  const tn = useTranslations("admin.nav");

  return (
    <nav className={["space-y-4 p-3", className].filter(Boolean).join(" ")}>
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.groupKey}>
          <p className="mb-1 px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            {tn(`groups.${group.groupKey}`)}
          </p>
          <div className="space-y-1">
            {group.items.map(({ href, icon: Icon }) => {
              const isActive =
                pathname === href || (href !== "/" && pathname.startsWith(href));
              const ik = adminNavItemKey(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => onNavigate?.()}
                  className={[
                    "flex items-center gap-2 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-all border",
                    isActive
                      ? "border-foreground bg-primary text-primary-foreground shadow-xs"
                      : "border-transparent text-foreground hover:border-foreground hover:bg-card hover:shadow-xs",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{tn(`items.${ik}`)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
