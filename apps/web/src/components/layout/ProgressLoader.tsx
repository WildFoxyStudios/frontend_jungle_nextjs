"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function ProgressLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show loader on route change initiation
    // This is a simple simulation as Next.js 13+ doesn't have native Router events
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent overflow-hidden">
      <div className="h-full bg-primary animate-progress-loading shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
      <style jsx>{`
        @keyframes progress-loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(-20%); }
          100% { transform: translateX(0); }
        }
        .animate-progress-loading {
          animation: progress-loading 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
