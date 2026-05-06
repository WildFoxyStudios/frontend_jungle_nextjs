"use client";

import { Card, CardContent } from "@jungle/ui";
import { Apple, Smartphone, Globe } from "lucide-react";
import Link from "next/link";

const STORE_LINKS = {
 appStore: process.env.NEXT_PUBLIC_APP_STORE_URL ?? "https://apps.apple.com/",
 playStore:
 process.env.NEXT_PUBLIC_PLAY_STORE_URL ??
 "https://play.google.com/store/apps/",
};

export default function GetTheAppPage() {
 return (
 <div className="mx-auto max-w-3xl px-4 py-12">
 <div className="mb-10 text-center">
 <h1 className="mb-3 text-4xl font-bold sm:text-5xl">Get the App</h1>
 <p className="text-lg text-muted-foreground">
 Connect with your community on the go.
 </p>
 </div>

 <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
 <Link
 href={STORE_LINKS.appStore}
 target="_blank"
 rel="noopener noreferrer"
 >
 <Card className="h-full transition-colors hover:bg-muted/50 rounded-lg">
 <CardContent className="flex items-center gap-4 p-6">
 <Apple className="h-10 w-10 text-foreground" />
 <div>
 <p className="text-[13px] font-medium text-muted-foreground">
 Download on the
 </p>
 <p className="text-lg font-semibold">App Store</p>
 </div>
 </CardContent>
 </Card>
 </Link>

 <Link
 href={STORE_LINKS.playStore}
 target="_blank"
 rel="noopener noreferrer"
 >
 <Card className="h-full transition-colors hover:bg-muted/50 rounded-lg">
 <CardContent className="flex items-center gap-4 p-6">
 <Smartphone className="h-10 w-10 text-foreground" />
 <div>
 <p className="text-[13px] font-medium text-muted-foreground">
 Get it on
 </p>
 <p className="text-lg font-semibold">Google Play</p>
 </div>
 </CardContent>
 </Card>
 </Link>
 </div>

 <Card>
 <CardContent className="flex items-start gap-4 p-6">
 <Globe className="mt-1 h-6 w-6 shrink-0 text-primary" />
 <div>
 <h2 className="mb-1 text-lg font-bold">Or use the web app</h2>
 <p className="text-sm text-muted-foreground">
 The web experience supports Add to Home Screen on iOS and Android,
 giving you a native-like, offline-aware app without an install.
 </p>
 </div>
 </CardContent>
 </Card>
 </div>
 );
}
