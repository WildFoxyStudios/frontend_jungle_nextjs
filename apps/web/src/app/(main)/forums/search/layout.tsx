import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("forum_search");
  return { title: t("pageTitle") };
}

export default function ForumSearchLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8"><div className="h-64 animate-pulse bg-muted/30 rounded-xl" /></div>}>
      {children}
    </Suspense>
  );
}
