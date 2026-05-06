import type { Notification, PaginatedResponse } from "@jungle/api-client";
/**
 * Notifications list + mutations without React Query so consumers work without
 * `QueryClientProvider` (web app removed TanStack from the tree).
 */
export declare function useNotifications(): {
    query: {
        data: {
            pages: PaginatedResponse<Notification>[];
        } | undefined;
        isLoading: boolean;
        fetchNextPage: () => Promise<void>;
        hasNextPage: boolean;
        isFetchingNextPage: boolean;
    };
    markRead: {
        mutate: (id: number) => void;
    };
    markAllRead: {
        isPending: boolean;
        mutate: () => void;
    };
    refetch: () => Promise<void>;
};
//# sourceMappingURL=use-notifications.d.ts.map