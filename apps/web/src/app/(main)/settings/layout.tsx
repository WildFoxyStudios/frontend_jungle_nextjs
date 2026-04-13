import type { ReactNode } from "react";
import Link from "next/link";

const SETTINGS_NAV = [
  { href: "/settings", label: "General" },
  { href: "/settings/privacy", label: "Privacy" },
  { href: "/settings/security", label: "Security" },
  { href: "/settings/sessions", label: "Sessions" },
  { href: "/settings/notifications", label: "Notifications" },
  { href: "/settings/design", label: "Design" },
  { href: "/settings/social-links", label: "Social Links" },
  { href: "/settings/blocked", label: "Blocked Users" },
  { href: "/settings/profile-fields", label: "Profile Fields" },
  { href: "/settings/experience", label: "Experience" },
  { href: "/settings/certifications", label: "Certifications" },
  { href: "/settings/projects", label: "Projects" },
  { href: "/settings/monetization", label: "Monetization" },
  { href: "/settings/points", label: "Points" },
  { href: "/settings/affiliates", label: "Affiliates" },
  { href: "/settings/referrals", label: "Referrals" },
  { href: "/settings/invitations", label: "Invitations" },
  { href: "/settings/addresses", label: "Addresses" },
  { href: "/settings/payments", label: "Payments" },
  { href: "/settings/transactions", label: "Transactions" },
  { href: "/settings/verification", label: "Verification" },
  { href: "/settings/delete-account", label: "Delete Account" },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-4 flex gap-6">
      <aside className="hidden md:block w-56 shrink-0">
        <nav className="space-y-1">
          {SETTINGS_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
