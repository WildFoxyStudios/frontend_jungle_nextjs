import type { ReactNode } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function StaticLayout({ children }: { children: ReactNode }) {
 return (
 <div className="flex min-h-svh flex-col">
 <header className="border-b bg-card">
 <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
 <Link
 href="/"
 className="text-xl font-bold text-foreground"
 >
 Jungle
 </Link>
 <nav className="flex items-center gap-4 text-xs font-semibold">
 <Link href="/login" className="hover:text-primary">Login</Link>
 <Link href="/register" className="hover:text-primary">Register</Link>
 </nav>
 </div>
 </header>
 <main className="flex-1">{children}</main>
 <footer className="border-t bg-card">
 <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-5 text-[13px] font-medium text-muted-foreground">
 <Link href="/about" className="hover:text-foreground">About</Link>
 <Link href="/terms" className="hover:text-foreground">Terms</Link>
 <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
 <Link href="/contact" className="hover:text-foreground">Contact</Link>
 </div>
 </footer>
 </div>
 );
}
