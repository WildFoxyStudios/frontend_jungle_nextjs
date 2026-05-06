"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import { LiveNativeRoomPage } from "@/components/live/LiveNativeRoomPage";
import { LiveStreamRoom } from "@/components/live/LiveStreamRoom";
import { LiveVideoErrorBoundary } from "@/components/live/LiveVideoErrorBoundary";
import { Button } from "@jungle/ui";
import { useTranslations } from "next-intl";

interface Props {
 params: Promise<{ id: string }>;
}

export default function LiveRoutePage({ params }: Props) {
 const { id } = use(params);
 const t = useTranslations("liveRoom");

 if (id.startsWith("room_")) {
 return (
 <LiveVideoErrorBoundary
 fallback={
 <div className="mx-auto max-w-lg px-4 py-16 text-center text-[15px] font-semibold text-muted-foreground">
 {t("millicastError")}
 </div>
 }
 >
 <LiveNativeRoomPage roomId={id} />
 </LiveVideoErrorBoundary>
 );
 }

 const n = Number(id);
 if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
 return (
 <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
 <p className="text-lg font-semibold">{t("invalidStream")}</p>
 <Button asChild variant="outline">
 <Link href="/live">{t("pageTitle")}</Link>
 </Button>
 </div>
 );
 }

 return (
 <Suspense
 fallback={
 <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">{t("connecting")}</div>
 }
 >
 <LiveStreamRoom streamId={n} />
 </Suspense>
 );
}
