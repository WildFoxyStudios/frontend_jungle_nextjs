"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="w-full py-6 mt-auto border-t bg-background">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          © {year} Jungle. All rights reserved.
        </div>
        
        <nav>
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
            <li>
              <Link href="/feed" className="hover:text-primary transition-colors">Home</Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            </li>
            <li>
              <Link href="/refund" className="hover:text-primary transition-colors">Refund</Link>
            </li>
            <li>
              <Link href="/blogs" className="hover:text-primary transition-colors">Blog</Link>
            </li>
            <li>
              <Link href="/developers" className="hover:text-primary transition-colors">Developers</Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors">
          <Globe className="h-3.5 w-3.5" />
          <span>Language: English</span>
        </div>
      </div>
    </footer>
  );
}
