"use client";

import { Card, CardContent } from "@jungle/ui";
import { Hammer, RefreshCcw, Twitter, Instagram, Globe } from "lucide-react";

export default function MaintenancePage() {
 return (
 <div className="flex min-h-svh items-center justify-center bg-secondary/40 p-4">
 <Card className="w-full max-w-md overflow-hidden border border-t-4 border-t-primary shadow-lg">
 <CardContent className="p-8 text-center space-y-6">
 <div className="relative mx-auto h-24 w-24">
 <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
 <div className="relative h-full w-full bg-primary/20 text-primary rounded-full flex items-center justify-center">
 <Hammer className="h-10 w-10 animate-bounce" />
 </div>
 </div>
 
 <div className="space-y-2">
 <h1 className="text-3xl font-bold">Down for Maintenance</h1>
 <p className="text-muted-foreground text-sm leading-relaxed">
 We&apos;re currently performing scheduled maintenance to upgrade our servers. We&apos;ll be back online shortly!
 </p>
 </div>

 <div className="flex items-center justify-center gap-4 border-t pt-4 text-muted-foreground">
 <a href="#" className="hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
 <a href="#" className="hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
 <a href="#" className="hover:text-primary transition-colors"><Globe className="h-5 w-5" /></a>
 </div>
 
 <div className="mx-auto flex w-fit items-center justify-center gap-2 bg-muted/40 px-3 py-1">
 <RefreshCcw className="h-3 w-3 animate-spin text-primary" />
 <span className="text-[13px] font-medium">Checking Status...</span>
 </div>
 </CardContent>
 </Card>
 </div>
 );
}
