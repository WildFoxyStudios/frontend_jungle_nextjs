"use client";

import {
 Button,
 ScrollArea,
 Sheet,
 SheetContent,
 SheetHeader,
 SheetTitle,
 SheetTrigger,
} from "@jungle/ui";
import { PanelRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { RightSidebarContent } from "./RightSidebar";

/** Mobile / tablet: same widgets as the desktop right rail, in a right sheet. */
export function RightRailSheet() {
 const t = useTranslations("header");

 return (
 <div className="shrink-0 lg:hidden">
 <Sheet>
 <SheetTrigger asChild>
 <Button
 type="button"
 variant="outline"
 size="icon"
 className="h-10 w-10 shrink-0 rounded-full hover:bg-muted/50"
 aria-label={t("discoverPanel")}
 >
 <PanelRight className="h-5 w-5" aria-hidden />
 </Button>
 </SheetTrigger>
 <SheetContent
 side="right"
 className="flex w-[min(100vw-0.5rem,22rem)] flex-col gap-0 border-l p-0"
 >
 <SheetHeader className="shrink-0 space-y-0 border-b bg-[linear-gradient(135deg,hsl(var(--secondary)/0.35),hsl(var(--primary)/0.12))] px-4 py-3 text-left">
 <SheetTitle className="font-semibold text-base">
 {t("discoverPanel")}
 </SheetTitle>
 </SheetHeader>
 <ScrollArea className="h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom,0px))] px-4 py-4">
 <RightSidebarContent />
 </ScrollArea>
 </SheetContent>
 </Sheet>
 </div>
 );
}
