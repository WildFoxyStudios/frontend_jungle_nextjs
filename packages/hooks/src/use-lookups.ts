"use client";

import { useEffect, useState } from "react";
import { referenceApi, type LookupItem } from "@jungle/api-client";

const cache = new Map<string, LookupItem[]>();
const inflight = new Map<string, Promise<LookupItem[]>>();

async function fetchLookups(lookupType: string): Promise<LookupItem[]> {
  if (cache.has(lookupType)) return cache.get(lookupType)!;
  if (inflight.has(lookupType)) return inflight.get(lookupType)!;

  const promise = referenceApi
    .getLookups(lookupType)
    .then((r) => {
      const data = (r.data ?? []) as LookupItem[];
      cache.set(lookupType, data);
      return data;
    })
    .catch(() => {
      cache.delete(lookupType);
      return [] as LookupItem[];
    })
    .finally(() => {
      inflight.delete(lookupType);
    });

  inflight.set(lookupType, promise);
  return promise;
}

/**
 * Fetches active lookups for a given type via GET /v1/lookups/{type}.
 * Results are cached at module level for the remainder of the session
 * so multiple components sharing the same type only fire one request.
 */
export function useLookups(lookupType: string) {
  const [data, setData] = useState<LookupItem[]>(() => cache.get(lookupType) ?? []);
  const [loading, setLoading] = useState(() => !cache.has(lookupType));

  useEffect(() => {
    if (cache.has(lookupType)) {
      setData(cache.get(lookupType)!);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchLookups(lookupType).then((items) => {
      if (!cancelled) {
        setData(items);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [lookupType]);

  return { data, loading };
}
