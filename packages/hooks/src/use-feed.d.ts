import type { Post, PaginatedResponse } from "@jungle/api-client";
/** Post-type filter values accepted by the backend `/v1/feed?filter=`. */
export type FeedPostType = "all" | "text" | "photos" | "videos" | "music" | "files" | "location" | "following" | "trending";
export interface FeedFilter {
    type?: FeedPostType;
    group_id?: number;
    page_id?: number;
    username?: string;
}
/**
 * Home feed with infinite scroll. No React Query — works without
 * `QueryClientProvider` (web app removed TanStack from the tree).
 */
export declare function useFeed(filter?: FeedFilter): {
    data: {
        pages: PaginatedResponse<Post>[];
    } | undefined;
    isLoading: boolean;
    fetchNextPage: () => Promise<void>;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    refetch: () => Promise<void>;
};
export declare function useExploreFeed(): {
    data: {
        pages: PaginatedResponse<Post>[];
    } | undefined;
    isLoading: boolean;
    fetchNextPage: () => Promise<void>;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
};
//# sourceMappingURL=use-feed.d.ts.map