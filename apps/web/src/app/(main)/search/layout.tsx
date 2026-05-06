import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * Segment title for `/search`; the client page still sets `document.title`
 * with the query (`search_extra.documentTitleQuery`).
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("search") };
}

export default function SearchLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8"><div className="h-64 animate-pulse bg-muted/30 rounded-xl" /></div>}>
      {children}
    </Suspense>
  );
}
