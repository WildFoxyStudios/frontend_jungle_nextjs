"use client";

import { useEffect, useState, useCallback } from "react";
import { api, type PublicConfig } from "@jungle/api-client";

let cached: PublicConfig | null = null;
let loaded = false;
let inflight: Promise<PublicConfig | null> | null = null;

async function loadPublicConfig(): Promise<PublicConfig | null> {
  if (loaded) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      cached = await api.get<PublicConfig>("/v1/config/public");
    } catch {
      cached = null;
    } finally {
      loaded = true;
      inflight = null;
    }
    return cached;
  })();
  return inflight;
}

/**
 * `/v1/config/public` once per page load, shared across all subscribers.
 * No React Query — works without `QueryClientProvider` on the web app.
 */
export function usePublicConfig() {
  const [version, setVersion] = useState(0);
  const [config, setConfig] = useState<PublicConfig | null>(() => (loaded ? cached : null));
  const [isLoading, setIsLoading] = useState(() => !loaded);

  const refetch = useCallback(() => {
    loaded = false;
    cached = null;
    inflight = null;
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (loaded) {
      setConfig(cached);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    void loadPublicConfig().then((data) => {
      if (!cancelled) {
        setConfig(data);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  return {
    config,
    websiteMode: config?.website_mode ?? "normal",
    isLoading,
    refetch,
  };
}
