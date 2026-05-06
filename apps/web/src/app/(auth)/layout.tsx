import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function AuthLayout({ children }: { children: ReactNode }) {
 return (
 <div className="relative flex min-h-svh flex-col items-center justify-center px-4 py-8 sm:py-12 pt-safe pb-safe">
 <div className="absolute right-3 top-3 flex items-center gap-1 sm:right-4 sm:top-4">
 <ThemeToggle />
 <LanguageSwitcher />
 </div>
 <Link
 href="/"
 className="mb-6 text-3xl font-bold text-foreground sm:text-4xl"
 >
 Jungle
 </Link>
 <div className="w-full max-w-md">{children}</div>
 </div>
 );
}
