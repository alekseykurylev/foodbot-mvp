"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const CART_STORAGE_KEY = "foodbot-cart";

export type CartItem = {
  productId: number;
  quantity: number;
};

type AddCartItemInput = {
  productId: number;
  quantity?: number;
};

type CartActions = {
  addItem: (item: AddCartItemInput) => void;
  clearCart: () => void;
  decrementItem: (productId: number) => void;
  incrementItem: (productId: number) => void;
  removeItem: (productId: number) => void;
  setItemQuantity: (productId: number, quantity: number) => void;
};

type CartState = {
  items: CartItem[];
  actions: CartActions;
};

function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.max(1, Math.trunc(quantity));
}

function updateItemQuantity(items: CartItem[], productId: number, quantity: number) {
  const normalizedQuantity = normalizeQuantity(quantity);

  return items.map((item) =>
    item.productId === productId ? { ...item, quantity: normalizedQuantity } : item,
  );
}

const useCartStoreBase = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      actions: {
        addItem: ({ productId, quantity = 1 }) => {
          set((state) => {
            const normalizedQuantity = normalizeQuantity(quantity);
            const existingItem = state.items.find((item) => item.productId === productId);

            if (!existingItem) {
              return {
                items: [...state.items, { productId, quantity: normalizedQuantity }],
              };
            }

            return {
              items: state.items.map((item) =>
                item.productId === productId
                  ? { ...item, quantity: item.quantity + normalizedQuantity }
                  : item,
              ),
            };
          });
        },
        clearCart: () => {
          set({ items: [] });
        },
        decrementItem: (productId) => {
          set((state) => ({
            items: state.items
              .map((item) =>
                item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item,
              )
              .filter((item) => item.quantity > 0),
          }));
        },
        incrementItem: (productId) => {
          set((state) => ({
            items: state.items.map((item) =>
              item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item,
            ),
          }));
        },
        removeItem: (productId) => {
          set((state) => ({
            items: state.items.filter((item) => item.productId !== productId),
          }));
        },
        setItemQuantity: (productId, quantity) => {
          set((state) => {
            if (quantity <= 0) {
              return {
                items: state.items.filter((item) => item.productId !== productId),
              };
            }

            return {
              items: updateItemQuantity(state.items, productId, quantity),
            };
          });
        },
      },
    }),
    {
      name: CART_STORAGE_KEY,
      partialize: (state) => ({ items: state.items }),
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

export function useCartItems() {
  return useCartStoreBase((state) => state.items);
}

export function useCartTotalItems() {
  return useCartStoreBase((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );
}

export function useCartItemQuantity(productId: number) {
  return useCartStoreBase(
    (state) => state.items.find((item) => item.productId === productId)?.quantity ?? 0,
  );
}

export function useCartActions() {
  return useCartStoreBase((state) => state.actions);
}
