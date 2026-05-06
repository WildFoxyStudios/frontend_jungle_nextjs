"use client";

import { useAuthStore } from "@jungle/hooks";
import { Button, Card, CardContent } from "@jungle/ui";
import { ShieldAlert, LogOut, Mail } from "lucide-react";
import Link from "next/link";

export default function BannedPage() {
 const { logout } = useAuthStore();

 return (
 <div className="min-h-svh flex items-center justify-center p-4 bg-secondary/40">
 <Card className="w-full max-w-md overflow-hidden border border-t-4 border-t-destructive shadow-md">
 <CardContent className="p-8 text-center space-y-6">
 <div className="h-20 w-20 border bg-destructive/10 text-destructive flex items-center justify-center mx-auto animate-pulse">
 <ShieldAlert className="h-10 w-10" />
 </div>

 <div className="space-y-2">
 <h1 className="text-2xl font-bold sm:text-3xl">Account Suspended</h1>
 <p className="text-sm leading-relaxed text-muted-foreground">
 Your account has been suspended for violating our terms of service or community guidelines.
 </p>
 </div>

 <div className="bg-muted/40 p-4 text-left space-y-2">
 <p className="text-[13px] font-medium text-muted-foreground">Reason</p>
 <p className="text-sm font-semibold italic">&ldquo;Multiple violations of content policy regarding spam and community safety.&rdquo;</p>
 </div>

 <div className="flex flex-col gap-3">
 <Button variant="outline" className="gap-2" onClick={() => logout()}>
 <LogOut className="h-4 w-4" /> Log out
 </Button>
 <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-primary">
 <Link href="/contact">
 <Mail className="h-4 w-4" /> Appeal this decision
 </Link>
 </Button>
 </div>

 <p className="text-[13px] font-medium text-muted-foreground pt-4 border-t">REF: BL-9932-SUSPENSION</p>
 </CardContent>
 </Card>
 </div>
 );
}
