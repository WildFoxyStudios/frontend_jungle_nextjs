"use client";
import { useEffect, useState } from "react";
import { api } from "@jungle/api-client";
let cached = null;
let loaded = false;
let inflight = null;
async function loadPublicConfig() {
    if (loaded)
        return cached;
    if (inflight)
        return inflight;
    inflight = (async () => {
        try {
            cached = await api.get("/v1/config/public");
        }
        catch {
            cached = null;
        }
        finally {
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
    const [config, setConfig] = useState(() => (loaded ? cached : null));
    const [isLoading, setIsLoading] = useState(() => !loaded);
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
    }, []);
    return {
        config,
        websiteMode: config?.website_mode ?? "normal",
        isLoading,
    };
}
//# sourceMappingURL=use-public-config.js.map