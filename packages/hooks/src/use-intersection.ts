"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function useIntersection(
  options?: IntersectionObserverInit,
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  // Prevent full Observer teardown when the caller passes an inline object
  // literal that is referentially new on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableOptions = useMemo(() => options, [JSON.stringify(options)]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry?.isIntersecting ?? false);
    }, stableOptions);

    observer.observe(el);
    return () => observer.disconnect();
  }, [stableOptions]);

  return [ref, isIntersecting];
}
