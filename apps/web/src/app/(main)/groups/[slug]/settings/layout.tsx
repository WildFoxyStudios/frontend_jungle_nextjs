"use client";

import { use } from "react";
import type { ReactNode } from "react";
import { SettingsSidebar } from "@/components/shared/SettingsSidebar";
import { Settings, Users, Lock, BarChart2, UserCheck, Trash2, ShieldCheck, ImageIcon, ListChecks } from "lucide-react";

interface Props {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default function GroupSettingsLayout({ children, params }: Props) {
  const { slug } = use(params);
  const base = `/groups/${slug}/settings`;

  const items = [
    { href: base, label: "General", icon: Settings },
    { href: `${base}/privacy`, label: "Privacy", icon: Lock },
    { href: `${base}/members`, label: "Members", icon: Users },
    { href: `${base}/requests`, label: "Join Requests", icon: UserCheck },
    { href: `${base}/privileges`, label: "Privileges", icon: ShieldCheck },
    { href: `${base}/avatar`, label: "Avatar & Cover", icon: ImageIcon },
    { href: `${base}/fields`, label: "Custom Fields", icon: ListChecks },
    { href: `${base}/analytics`, label: "Analytics", icon: BarChart2 },
    { href: `${base}/danger`, label: "Danger Zone", icon: Trash2 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Group Settings</h1>
      <div className="flex gap-6">
        <SettingsSidebar items={items} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
