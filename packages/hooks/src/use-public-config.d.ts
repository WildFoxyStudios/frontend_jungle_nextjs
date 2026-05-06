import { type PublicConfig } from "@jungle/api-client";
/**
 * `/v1/config/public` once per page load, shared across all subscribers.
 * No React Query — works without `QueryClientProvider` on the web app.
 */
export declare function usePublicConfig(): {
    config: PublicConfig | null;
    websiteMode: "normal" | "linkedin" | "instagram" | "patreon" | "askfm" | "twitter";
    isLoading: boolean;
};
//# sourceMappingURL=use-public-config.d.ts.map