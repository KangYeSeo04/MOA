// stores/cart.ts
import { create } from "zustand";

type CartState = {
  // ✅ 공동 금액 (restaurantId -> total)
  totals: Record<number, number>;

  // ✅ 유저별 수량 (userKey -> restaurantId -> (menuId -> qty))
  itemCountsByUser: Record<string, Record<number, Record<string, number>>>;

  addPrice: (restaurantId: number, delta: number) => void;
  resetTotal: (restaurantId: number) => void;

  increaseItem: (userKey: string, restaurantId: number, menuId: string) => void;
  decreaseItem: (userKey: string, restaurantId: number, menuId: string) => void;
  resetItems: (userKey: string, restaurantId: number) => void;

  // ✅ 핵심: “주문 접수(공동)” 시 해당 매장의 모든 유저 수량 초기화
  resetRestaurantItemsForAllUsers: (restaurantId: number) => void;
};

export const useCartStore = create<CartState>((set) => ({
  totals: {},
  itemCountsByUser: {},

  addPrice: (restaurantId, delta) =>
    set((state) => {
      const prev = Number(state.totals[restaurantId] ?? 0);
      const next = Math.max(0, prev + Number(delta));
      return { totals: { ...state.totals, [restaurantId]: next } };
    }),

  resetTotal: (restaurantId) =>
    set((state) => ({
      totals: { ...state.totals, [restaurantId]: 0 },
    })),

  increaseItem: (userKey, restaurantId, menuId) =>
    set((state) => {
      const byUser = state.itemCountsByUser[userKey] ?? {};
      const byR = byUser[restaurantId] ?? {};
      return {
        itemCountsByUser: {
          ...state.itemCountsByUser,
          [userKey]: {
            ...byUser,
            [restaurantId]: {
              ...byR,
              [menuId]: (byR[menuId] ?? 0) + 1,
            },
          },
        },
      };
    }),

  decreaseItem: (userKey, restaurantId, menuId) =>
    set((state) => {
      const byUser = state.itemCountsByUser[userKey] ?? {};
      const byR = byUser[restaurantId] ?? {};
      const nextQty = (byR[menuId] ?? 0) - 1;

      const nextByR =
        nextQty <= 0
          ? (() => {
              const { [menuId]: _, ...rest } = byR;
              return rest;
            })()
          : { ...byR, [menuId]: nextQty };

      return {
        itemCountsByUser: {
          ...state.itemCountsByUser,
          [userKey]: {
            ...byUser,
            [restaurantId]: nextByR,
          },
        },
      };
    }),

  resetItems: (userKey, restaurantId) =>
    set((state) => {
      const byUser = state.itemCountsByUser[userKey] ?? {};
      return {
        itemCountsByUser: {
          ...state.itemCountsByUser,
          [userKey]: {
            ...byUser,
            [restaurantId]: {},
          },
        },
      };
    }),

  resetRestaurantItemsForAllUsers: (restaurantId) =>
    set((state) => {
      const next: CartState["itemCountsByUser"] = {};

      for (const [userKey, byUser] of Object.entries(state.itemCountsByUser)) {
        next[userKey] = {
          ...byUser,
          [restaurantId]: {}, // ✅ 해당 매장만 싹 비움
        };
      }

      return { itemCountsByUser: next };
    }),
}));