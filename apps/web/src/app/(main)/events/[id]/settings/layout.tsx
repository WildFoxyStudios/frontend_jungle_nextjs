"use client";

import { use } from "react";
import type { ReactNode } from "react";
import { SettingsSidebar } from "@/components/shared/SettingsSidebar";
import { Settings, Users, Star, MailOpen, BarChart2, Trash2 } from "lucide-react";

interface Props {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default function EventSettingsLayout({ children, params }: Props) {
  const { id } = use(params);
  const base = `/events/${id}/settings`;

  const items = [
    { href: base, label: "General", icon: Settings },
    { href: `${base}/attendees`, label: "Attendees", icon: Users },
    { href: `${base}/interested`, label: "Interested", icon: Star },
    { href: `${base}/invited`, label: "Invited", icon: MailOpen },
    { href: `${base}/analytics`, label: "Analytics", icon: BarChart2 },
    { href: `${base}/danger`, label: "Danger Zone", icon: Trash2 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Event Settings</h1>
      <div className="flex gap-6">
        <SettingsSidebar items={items} />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
