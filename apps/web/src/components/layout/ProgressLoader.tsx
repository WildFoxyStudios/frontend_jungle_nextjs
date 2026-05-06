"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Top-of-page progress strip shown briefly on route changes.
 * Neobrutal-style: thick black bar with offset solid color.
 */
export function ProgressLoader() {
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const [loading, setLoading] = useState(false);

 useEffect(() => {
 setLoading(true);
 const timeout = setTimeout(() => setLoading(false), 500);
 return () => clearTimeout(timeout);
 }, [pathname, searchParams]);

 if (!loading) return null;

 return (
 <div
 role="progressbar"
 aria-label="Loading"
 className="fixed inset-x-0 top-0 z-[9999] h-1 overflow-hidden bg-foreground"
 >
 <div className="h-full w-1/3 animate-progress-loading bg-primary" />
 <style jsx>{`
 @keyframes progress-loading {
 0% { transform: translateX(-100%); }
 50% { transform: translateX(150%); }
 100% { transform: translateX(400%); }
 }
 .animate-progress-loading {
 animation: progress-loading 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
 }
 `}</style>
 </div>
 );
}
