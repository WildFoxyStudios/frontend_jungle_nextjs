import { QueryClient } from "@tanstack/react-query";

let queryClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a new QueryClient
    return new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60_000 },
      },
    });
  }
  // Browser: reuse singleton
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60_000 },
      },
    });
  }
  return queryClient;
}
