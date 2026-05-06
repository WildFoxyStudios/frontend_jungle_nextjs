"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { postsApi } from "@jungle/api-client";
function feedTypeParam(filter) {
    const t = filter?.type;
    return t && t !== "all" ? t : undefined;
}
/**
 * Home feed with infinite scroll. No React Query — works without
 * `QueryClientProvider` (web app removed TanStack from the tree).
 */
export function useFeed(filter) {
    const typeFilter = feedTypeParam(filter);
    const filterKey = JSON.stringify(filter ?? {});
    // Ref to avoid stale closure capture of typeFilter in fetchNextPage
    const typeFilterRef = useRef(typeFilter);
    typeFilterRef.current = typeFilter;
    const [pages, setPages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            setPages([]);
            try {
                const first = await postsApi.getFeed(undefined, typeFilter);
                if (!cancelled)
                    setPages([first]);
            }
            catch {
                if (!cancelled)
                    setPages([]);
            }
            finally {
                if (!cancelled)
                    setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [filterKey, typeFilter]);
    const lastPage = pages[pages.length - 1];
    const hasNextPage = Boolean(lastPage?.meta.has_more);
    const fetchNextPage = useCallback(async () => {
        if (!lastPage?.meta.has_more || isFetchingNextPage)
            return;
        const cursor = lastPage.meta.cursor;
        setIsFetchingNextPage(true);
        try {
            // Use ref for latest filter to avoid stale closure
            const page = await postsApi.getFeed(cursor, typeFilterRef.current);
            setPages((prev) => [...prev, page]);
        }
        catch {
            /* keep existing pages; next manual scroll retries */
        }
        finally {
            setIsFetchingNextPage(false);
        }
    }, [lastPage, isFetchingNextPage]);
    const refetch = useCallback(async () => {
        setIsLoading(true);
        try {
            const first = await postsApi.getFeed(undefined, typeFilterRef.current);
            setPages([first]);
        }
        catch {
            setPages([]);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    return {
        data: pages.length > 0 ? { pages } : undefined,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    };
}
export function useExploreFeed() {
    const [pages, setPages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            setPages([]);
            try {
                const first = await postsApi.getExploreFeed(undefined);
                if (!cancelled)
                    setPages([first]);
            }
            catch {
                if (!cancelled)
                    setPages([]);
            }
            finally {
                if (!cancelled)
                    setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);
    const lastPage = pages[pages.length - 1];
    const hasNextPage = Boolean(lastPage?.meta.has_more);
    const fetchNextPage = useCallback(async () => {
        if (!lastPage?.meta.has_more || isFetchingNextPage)
            return;
        const cursor = lastPage.meta.cursor;
        setIsFetchingNextPage(true);
        try {
            const page = await postsApi.getExploreFeed(cursor);
            setPages((prev) => [...prev, page]);
        }
        catch {
            /* keep existing pages; next manual scroll retries */
        }
        finally {
            setIsFetchingNextPage(false);
        }
    }, [lastPage, isFetchingNextPage]);
    return {
        data: pages.length > 0 ? { pages } : undefined,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    };
}
//# sourceMappingURL=use-feed.js.map