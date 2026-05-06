"use client";
import { useEffect, useRef, useState } from "react";
export function useIntersection(options) {
    const ref = useRef(null);
    const [isIntersecting, setIsIntersecting] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry?.isIntersecting ?? false);
        }, options);
        observer.observe(el);
        return () => observer.disconnect();
    }, [options]);
    return [ref, isIntersecting];
}
//# sourceMappingURL=use-intersection.js.map