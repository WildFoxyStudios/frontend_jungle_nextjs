"use client";
import { useEffect, useRef } from "react";
import { postsApi } from "@jungle/api-client";
export function usePostImpression(postId, enabled = true) {
    const ref = useRef(null);
    const trackedRef = useRef(false);
    const enterTimeRef = useRef(0);
    useEffect(() => {
        if (!enabled || trackedRef.current)
            return;
        const el = ref.current;
        if (!el)
            return;
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    enterTimeRef.current = Date.now();
                }
                else if (enterTimeRef.current > 0) {
                    const dwellMs = Date.now() - enterTimeRef.current;
                    if (dwellMs > 500 && !trackedRef.current) {
                        trackedRef.current = true;
                        const rect = el.getBoundingClientRect();
                        const viewportHeight = window.innerHeight;
                        const scrollDepth = Math.min(rect.top / viewportHeight, 1);
                        postsApi.recordImpression?.(postId, {
                            dwell_ms: Math.round(dwellMs),
                            scroll_depth: Math.round(scrollDepth * 100) / 100,
                            source: "feed",
                        }).catch(() => { });
                    }
                }
            }
        }, { threshold: 0.5 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [postId, enabled]);
    return ref;
}
//# sourceMappingURL=use-post-impression.js.map