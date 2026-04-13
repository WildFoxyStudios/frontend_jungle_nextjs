"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commerceApi } from "@jungle/api-client";

export function useCart() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["cart"],
    queryFn: () => commerceApi.getCart(),
    staleTime: 30_000,
  });

  const addItem = useMutation({
    mutationFn: ({ productId, qty }: { productId: number; qty: number }) =>
      commerceApi.addToCart(productId, qty),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number }) =>
      commerceApi.updateCartItem(id, qty),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeItem = useMutation({
    mutationFn: (id: number) => commerceApi.removeFromCart(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  return {
    cart: query.data,
    isLoading: query.isLoading,
    addItem,
    updateItem,
    removeItem,
    itemCount: query.data?.items.length ?? 0,
  };
}
