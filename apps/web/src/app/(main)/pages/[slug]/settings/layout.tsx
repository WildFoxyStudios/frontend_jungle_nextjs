"use client";

import { use } from "react";
import type { ReactNode } from "react";
import { SettingsSidebar } from "@/components/shared/SettingsSidebar";
import { Settings, Users, BarChart2, ShieldCheck, Trash2, Link2, Bell, MessageSquare, ImageIcon, ListChecks, Palette, UserCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default function PageSettingsLayout({ children, params }: Props) {
  const { slug } = use(params);
  const base = `/pages/${slug}/settings`;

  const items = [
    { href: base, label: "General", icon: Settings },
    { href: `${base}/profile`, label: "Profile Info", icon: UserCircle },
    { href: `${base}/avatar`, label: "Avatar & Cover", icon: ImageIcon },
    { href: `${base}/design`, label: "Design", icon: Palette },
    { href: `${base}/privileges`, label: "Privileges", icon: ShieldCheck },
    { href: `${base}/fields`, label: "Custom Fields", icon: ListChecks },
    { href: `${base}/admins`, label: "Admin Roster", icon: Users },
    { href: `${base}/social-links`, label: "Social Links", icon: Link2 },
    { href: `${base}/notifications`, label: "Notifications", icon: Bell },
    { href: `${base}/autoresponder`, label: "Auto Reply", icon: MessageSquare },
    { href: `${base}/analytics`, label: "Analytics", icon: BarChart2 },
    { href: `${base}/verification`, label: "Verification", icon: ShieldCheck },
    { href: `${base}/danger`, label: "Danger Zone", icon: Trash2 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Page Settings</h1>
      <div className="flex gap-6">
        <SettingsSidebar items={items} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
