import type { ReactNode } from "react";
import Link from "next/link";

export default function StaticLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">Jungle</Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/login" className="hover:underline">Login</Link>
            <Link href="/register" className="hover:underline">Register</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6">
        <div className="max-w-5xl mx-auto px-4 flex gap-4 text-sm text-muted-foreground">
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/terms" className="hover:underline">Terms</Link>
          <Link href="/privacy" className="hover:underline">Privacy</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
