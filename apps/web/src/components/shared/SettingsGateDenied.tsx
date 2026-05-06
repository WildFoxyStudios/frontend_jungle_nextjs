"use client";

import Link from "next/link";
import { Button, Card, CardContent } from "@jungle/ui";
import type { ReactNode } from "react";

type Props = {
 title: string;
 description?: string;
 extraActions?: ReactNode;
 backHref: string;
 backLabel: string;
};

/** Full-width empty state used when sidebar settings routes forbid access. */
export function SettingsGateDenied({
 title,
 description,
 extraActions,
 backHref,
 backLabel,
}: Props) {
 return (
 <div className="mx-auto max-w-lg px-4 py-16">
 <Card className="overflow-hidden border rounded-lg">
 <CardContent className="space-y-4 p-8 text-center">
 <h1 className="text-xl font-semibold">{title}</h1>
 {description ? (
 <p className="text-sm font-medium leading-relaxed text-muted-foreground">
 {description}
 </p>
 ) : null}
 <div className="flex flex-wrap items-center justify-center gap-3">
 {extraActions}
 <Button className="h-11 font-semibold" asChild>
 <Link href={backHref}>{backLabel}</Link>
 </Button>
 </div>
 </CardContent>
 </Card>
 </div>
 );
}
