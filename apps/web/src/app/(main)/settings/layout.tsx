"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const SETTINGS_NAV = [
  { href: "/settings", key: "general" },
  { href: "/settings/profile", key: "profile" },
  { href: "/settings/privacy", key: "privacy" },
  { href: "/settings/security", key: "security" },
  { href: "/settings/sessions", key: "sessions" },
  { href: "/settings/notifications", key: "notifications" },
  { href: "/settings/design", key: "design" },
  { href: "/settings/social-links", key: "socialLinks" },
  { href: "/settings/blocked", key: "blocked" },
  { href: "/settings/profile-fields", key: "profileFields" },
  { href: "/settings/experience", key: "experience" },
  { href: "/settings/certifications", key: "certifications" },
  { href: "/settings/projects", key: "projects" },
  { href: "/settings/monetization", key: "monetization" },
  { href: "/settings/points", key: "points" },
  { href: "/settings/affiliates", key: "affiliates" },
  { href: "/settings/referrals", key: "referrals" },
  { href: "/settings/invitations", key: "invitations" },
  { href: "/settings/addresses", key: "addresses" },
  { href: "/settings/payments", key: "payments" },
  { href: "/settings/transactions", key: "transactions" },
  { href: "/settings/verification", key: "verification" },
  { href: "/settings/information", key: "information" },
  { href: "/settings/open-to-work", key: "openToWork" },
  { href: "/settings/delete-account", key: "deleteAccount" },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("settings_nav");

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 flex gap-6">
      <aside className="hidden md:block w-56 shrink-0">
        <nav className="space-y-1">
          {SETTINGS_NAV.map(({ href, key }) => {
            const isActive = href === "/settings" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
              >
                {t(key)}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
