import type { Cart } from "@jungle/api-client";
type MutateOpts = {
    onSuccess?: () => void;
    onError?: (err?: unknown) => void;
};
/**
 * Cart CRUD without React Query — works without `QueryClientProvider` on web.
 */
export declare function useCart(): {
    cart: Cart | undefined;
    isLoading: boolean;
    addItem: {
        isPending: boolean;
        mutate: (vars: {
            productId: number;
            qty: number;
        }, opts?: MutateOpts) => void;
    };
    updateItem: {
        isPending: boolean;
        mutate: (vars: {
            id: number;
            qty: number;
        }, opts?: MutateOpts) => void;
    };
    removeItem: {
        isPending: boolean;
        mutate: (id: number, opts?: MutateOpts) => void;
    };
    itemCount: number;
    refetch: () => Promise<void>;
};
export {};
//# sourceMappingURL=use-cart.d.ts.map