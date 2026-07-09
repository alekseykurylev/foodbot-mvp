"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const CART_STORAGE_KEY = "foodbot-cart";
const CART_STORAGE_VERSION = 2;
export const CART_ITEM_MAX_QUANTITY = 50;
export const CART_ITEM_MIN_QUANTITY = 1;

export type CartItem = {
  image: {
    alt: string;
    src: string;
  } | null;
  name: string;
  price: number;
  productId: number;
  quantity: number;
};

type AddCartItemInput = {
  image?: CartItem["image"];
  name: string;
  price: number;
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
    return CART_ITEM_MIN_QUANTITY;
  }

  return Math.min(CART_ITEM_MAX_QUANTITY, Math.max(CART_ITEM_MIN_QUANTITY, Math.trunc(quantity)));
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
        addItem: ({ image = null, name, price, productId, quantity = 1 }) => {
          set((state) => {
            const normalizedQuantity = normalizeQuantity(quantity);
            const existingItem = state.items.find((item) => item.productId === productId);

            if (!existingItem) {
              return {
                items: [
                  ...state.items,
                  {
                    image,
                    name,
                    price,
                    productId,
                    quantity: normalizedQuantity,
                  },
                ],
              };
            }

            return {
              items: state.items.map((item) =>
                item.productId === productId
                  ? {
                      ...item,
                      image,
                      name,
                      price,
                      quantity: normalizeQuantity(item.quantity + normalizedQuantity),
                    }
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
            items: state.items.map((item) =>
              item.productId === productId
                ? { ...item, quantity: normalizeQuantity(item.quantity - 1) }
                : item,
            ),
          }));
        },
        incrementItem: (productId) => {
          set((state) => ({
            items: state.items.map((item) =>
              item.productId === productId
                ? { ...item, quantity: normalizeQuantity(item.quantity + 1) }
                : item,
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
            return {
              items: updateItemQuantity(state.items, productId, quantity),
            };
          });
        },
      },
    }),
    {
      name: CART_STORAGE_KEY,
      migrate: (persistedState, version) => {
        if (version >= CART_STORAGE_VERSION) {
          return persistedState;
        }

        if (!persistedState || typeof persistedState !== "object") {
          return { items: [] };
        }

        const state = persistedState as Partial<CartState>;

        return {
          items: Array.isArray(state.items)
            ? state.items.filter((item) => {
                return (
                  typeof item?.productId === "number" &&
                  typeof item.name === "string" &&
                  typeof item.price === "number" &&
                  typeof item.quantity === "number"
                );
              })
            : [],
        };
      },
      partialize: (state) => ({ items: state.items }),
      storage: createJSONStorage(() => localStorage),
      version: CART_STORAGE_VERSION,
    },
  ),
);

export function useCartItems() {
  return useCartStoreBase((state) => state.items);
}

export function useCartTotalItems() {
  return useCartStoreBase((state) => state.items.reduce((total, item) => total + item.quantity, 0));
}

export function useCartTotalAmount() {
  return useCartStoreBase((state) =>
    state.items.reduce((total, item) => total + item.price * item.quantity, 0),
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
