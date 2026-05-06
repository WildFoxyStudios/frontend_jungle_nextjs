"use client";

import { useCallback, useEffect, useState } from "react";
import { commerceApi } from "@jungle/api-client";
import type { Cart } from "@jungle/api-client";

type MutateOpts = { onSuccess?: () => void; onError?: (err?: unknown) => void };

/**
 * Cart CRUD without React Query — works without `QueryClientProvider` on web.
 */
export function useCart() {
  const [cart, setCart] = useState<Cart | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [addPending, setAddPending] = useState(false);
  const [removePending, setRemovePending] = useState(false);
  const [updatePending, setUpdatePending] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setCart(await commerceApi.getCart());
    } catch {
      setCart(undefined);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    refresh().finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const addItem = {
    isPending: addPending,
    mutate: (vars: { productId: number; qty: number }, opts?: MutateOpts) => {
      void (async () => {
        setAddPending(true);
        try {
          const next = await commerceApi.addToCart(vars.productId, vars.qty);
          setCart(next);
          opts?.onSuccess?.();
        } catch (e) {
          opts?.onError?.(e);
        } finally {
          setAddPending(false);
        }
      })();
    },
  };

  const updateItem = {
    isPending: updatePending,
    mutate: (vars: { id: number; qty: number }, opts?: MutateOpts) => {
      void (async () => {
        setUpdatePending(true);
        try {
          const next = await commerceApi.updateCartItem(vars.id, vars.qty);
          setCart(next);
          opts?.onSuccess?.();
        } catch (e) {
          opts?.onError?.(e);
        } finally {
          setUpdatePending(false);
        }
      })();
    },
  };

  const removeItem = {
    isPending: removePending,
    mutate: (id: number, opts?: MutateOpts) => {
      void (async () => {
        setRemovePending(true);
        try {
          const next = await commerceApi.removeFromCart(id);
          setCart(next);
          opts?.onSuccess?.();
        } catch (e) {
          opts?.onError?.(e);
        } finally {
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
