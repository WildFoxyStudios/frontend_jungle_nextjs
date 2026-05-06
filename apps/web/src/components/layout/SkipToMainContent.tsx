"use client";

import { useTranslations } from "next-intl";

/** First-stop keyboard link to `#main-content` on `AppShell` (WCAG 2.x bypass blocks). */
export function SkipToMainContent() {
 const t = useTranslations("common");
 return (
 <a
 href="#main-content"
 className={[
 "fixed left-[max(0.5rem,env(safe-area-inset-left))]",
 "top-[max(0.5rem,env(safe-area-inset-top))] z-[200]",
 "-translate-y-[calc(100%+2rem)] focus:translate-y-0",
 "rounded-md border bg-primary px-4 py-2.5",
 "text-xs font-black text-primary-foreground shadow-md",
 "outline-none transition-transform duration-150",
 "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
 ].join(" ")}
 >
 {t("skipToContent")}
 </a>
 );
}
