"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { useMemo } from "react";

export function Footer() {
 const t = useTranslations("footer");
 const locale = useLocale();
 const year = new Date().getFullYear();
 const languageLabel = useMemo(() => {
 try {
 return new Intl.DisplayNames([locale], { type: "language" }).of(
 locale.split("-")[0] ?? locale
 );
 } catch {
 return locale;
 }
 }, [locale]);

 return (
 <footer className="mt-8 w-full border-t bg-card">
 <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center sm:flex-row sm:text-left">
 <p className="text-[13px] font-medium text-muted-foreground">
 © {year} Jungle. All rights reserved.
 </p>

 <nav>
 <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] font-medium text-foreground">
 <li>
 <Link href="/feed" className="hover:text-primary">Home</Link>
 </li>
 <li>
 <Link href="/about" className="hover:text-primary">{t("about")}</Link>
 </li>
 <li>
 <Link href="/contact" className="hover:text-primary">{t("contact")}</Link>
 </li>
 <li>
 <Link href="/privacy" className="hover:text-primary">{t("privacy")}</Link>
 </li>
 <li>
 <Link href="/terms" className="hover:text-primary">{t("terms")}</Link>
 </li>
 <li>
 <Link href="/refund" className="hover:text-primary">{t("refund")}</Link>
 </li>
 <li>
 <Link href="/blogs" className="hover:text-primary">{t("blogs")}</Link>
 </li>
 <li>
 <Link href="/developers" className="hover:text-primary">{t("developers")}</Link>
 </li>
 </ul>
 </nav>

 <div className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
 <Globe className="h-3.5 w-3.5" />
 <span>{languageLabel}</span>
 </div>
 </div>
 </footer>
 );
}
