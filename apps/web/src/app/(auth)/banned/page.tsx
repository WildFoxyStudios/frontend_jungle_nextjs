"use client";

import { useAuthStore } from "@jungle/hooks";
import { Button, Card, CardContent } from "@jungle/ui";
import { ShieldAlert, LogOut, Mail } from "lucide-react";
import Link from "next/link";

export default function BannedPage() {
  const { logout } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="max-w-md w-full border-t-4 border-t-destructive shadow-2xl overflow-hidden rounded-2xl">
        <CardContent className="p-8 text-center space-y-6">
          <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto animate-pulse">
             <ShieldAlert className="h-10 w-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Account Suspended</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your account has been suspended for violating our terms of service or community guidelines.
            </p>
          </div>

          <div className="bg-muted p-4 rounded-xl text-left space-y-2">
             <p className="text-xs font-bold uppercase tracking-wider opacity-50">Reason</p>
             <p className="text-sm font-medium italic">"Multiple violations of content policy regarding spam and community safety."</p>
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
          
          <p className="text-[10px] text-muted-foreground pt-4 border-t">REF: BL-9932-SUSPENSION</p>
        </CardContent>
      </Card>
    </div>
  );
}
