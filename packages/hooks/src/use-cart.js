"use client";
import { useCallback, useEffect, useState } from "react";
import { commerceApi } from "@jungle/api-client";
/**
 * Cart CRUD without React Query — works without `QueryClientProvider` on web.
 */
export function useCart() {
    const [cart, setCart] = useState(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [addPending, setAddPending] = useState(false);
    const [removePending, setRemovePending] = useState(false);
    const [updatePending, setUpdatePending] = useState(false);
    const refresh = useCallback(async () => {
        try {
            setCart(await commerceApi.getCart());
        }
        catch {
            setCart(undefined);
        }
    }, []);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoading(true);
            try {
                const next = await commerceApi.getCart();
                if (!cancelled)
                    setCart(next);
            }
            catch {
                if (!cancelled)
                    setCart(undefined);
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
    const addItem = {
        isPending: addPending,
        mutate: (vars, opts) => {
            void (async () => {
                setAddPending(true);
                try {
                    const next = await commerceApi.addToCart(vars.productId, vars.qty);
                    setCart(next);
                    opts?.onSuccess?.();
                }
                catch (e) {
                    opts?.onError?.(e);
                }
                finally {
                    setAddPending(false);
                }
            })();
        },
    };
    const updateItem = {
        isPending: updatePending,
        mutate: (vars, opts) => {
            void (async () => {
                setUpdatePending(true);
                try {
                    const next = await commerceApi.updateCartItem(vars.id, vars.qty);
                    setCart(next);
                    opts?.onSuccess?.();
                }
                catch (e) {
                    opts?.onError?.(e);
                }
                finally {
                    setUpdatePending(false);
                }
            })();
        },
    };
    const removeItem = {
        isPending: removePending,
        mutate: (id, opts) => {
            void (async () => {
                setRemovePending(true);
                try {
                    const next = await commerceApi.removeFromCart(id);
                    setCart(next);
                    opts?.onSuccess?.();
                }
                catch (e) {
                    opts?.onError?.(e);
                }
                finally {
                    setRemovePending(false);
                }
            })();
        },
    };
    return {
        cart,
        isLoading,
        addItem,
        updateItem,
        removeItem,
        itemCount: cart?.items.length ?? 0,
        refetch: refresh,
    };
}
//# sourceMappingURL=use-cart.js.map