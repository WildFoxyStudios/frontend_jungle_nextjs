import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="mb-6 text-3xl font-black uppercase tracking-tight text-foreground"
      >
        Jungle Admin
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
