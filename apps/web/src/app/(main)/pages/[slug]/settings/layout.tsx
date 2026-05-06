"use client";

import { use, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { pagesApi } from "@jungle/api-client";
import { SettingsSidebar } from "@/components/shared/SettingsSidebar";
import { SettingsGateDenied } from "@/components/shared/SettingsGateDenied";
import {
 Settings,
 Users,
 BarChart2,
 ShieldCheck,
 Trash2,
 Link2,
 Bell,
 MessageSquare,
 ImageIcon,
 ListChecks,
 Palette,
 UserCircle,
} from "lucide-react";
import { Skeleton } from "@jungle/ui";

interface Props {
 children: ReactNode;
 params: Promise<{ slug: string }>;
}

type Gate = "loading" | "ok" | "forbidden" | "missing";

export default function PageSettingsLayout({ children, params }: Props) {
 const { slug } = use(params);
 const t = useTranslations("settingsGate");
 const [gate, setGate] = useState<Gate>("loading");

 useEffect(() => {
 setGate("loading");
 pagesApi
 .getPage(slug)
 .then((p) => {
 if (!p.is_admin) setGate("forbidden");
 else setGate("ok");
 })
 .catch(() => setGate("missing"));
 }, [slug]);

 if (gate === "loading") {
 return (
 <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
 <Skeleton className="h-9 w-64" />
 <div className="flex gap-6">
 <Skeleton className="h-72 w-48 shrink-0" />
 <Skeleton className="h-96 flex-1" />
 </div>
 </div>
 );
 }

 if (gate === "missing") {
 return (
 <SettingsGateDenied
 title={t("resourceMissing")}
 backHref="/pages"
 backLabel={t("browsePages")}
 />
 );
 }

 if (gate === "forbidden") {
 return (
 <SettingsGateDenied
 title={t("pageAdminOnly")}
 backHref={`/pages/${slug}`}
 backLabel={t("viewPublicPage")}
 />
 );
 }

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
 <div className="mx-auto max-w-4xl px-4 py-6">
 <h1 className="mb-6 text-2xl font-bold">Page Settings</h1>
 <div className="flex gap-6">
 <SettingsSidebar items={items} />
 <main className="min-w-0 flex-1">{children}</main>
 </div>
 </div>
 );
}
