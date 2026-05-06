"use client";

import { use, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { eventsApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { SettingsSidebar } from "@/components/shared/SettingsSidebar";
import { SettingsGateDenied } from "@/components/shared/SettingsGateDenied";
import { Settings, Users, Star, MailOpen, BarChart2, Trash2 } from "lucide-react";
import { Button, Skeleton } from "@jungle/ui";

interface Props {
 children: ReactNode;
 params: Promise<{ id: string }>;
}

type Gate = "loading" | "ok" | "forbidden" | "missing" | "signIn";

export default function EventSettingsLayout({ children, params }: Props) {
 const { id } = use(params);
 const t = useTranslations("settingsGate");
 const user = useAuthStore((s) => s.user);
 const [gate, setGate] = useState<Gate>("loading");

 useEffect(() => {
 setGate("loading");
 void eventsApi
 .getEvent(Number(id))
 .then((e) => {
 if (!user) {
 setGate("signIn");
 return;
 }
 if (e.organizer?.id !== user.id) setGate("forbidden");
 else setGate("ok");
 })
 .catch(() => setGate("missing"));
 }, [id, user]);

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
 backHref="/events"
 backLabel={t("browseEvents")}
 />
 );
 }

 if (gate === "signIn") {
 return (
 <SettingsGateDenied
 title={t("signInToManageEvent")}
 description={t("eventOrganizerOnly")}
 backHref={`/events/${id}`}
 backLabel={t("viewPublicEvent")}
 extraActions={
 <Button variant="outline" className="h-11 font-semibold" asChild>
 <Link href={`/login?next=/events/${id}/settings`}>{t("signInShort")}</Link>
 </Button>
 }
 />
 );
 }

 if (gate === "forbidden") {
 return (
 <SettingsGateDenied
 title={t("eventOrganizerOnly")}
 backHref={`/events/${id}`}
 backLabel={t("viewPublicEvent")}
 />
 );
 }

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
 <div className="mx-auto max-w-4xl px-4 py-6">
 <h1 className="mb-6 text-2xl font-bold">Event Settings</h1>
 <div className="flex gap-6">
 <SettingsSidebar items={items} />
 <main className="min-w-0 flex-1">{children}</main>
 </div>
 </div>
 );
}
