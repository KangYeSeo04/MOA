import { create } from "zustand";

type CartState = {
  // restaurantId -> total price (개인 UI용: 내가 담은 금액)
  totals: Record<number, number>;

  // restaurantId -> (menuId -> qty) (개인 UI용: 내가 담은 수량)
  itemCounts: Record<number, Record<string, number>>;

  addPrice: (restaurantId: number, delta: number) => void;
  resetTotal: (restaurantId: number) => void;

  increaseItem: (restaurantId: number, menuId: string) => void;
  decreaseItem: (restaurantId: number, menuId: string) => void;
  resetItems: (restaurantId: number) => void;

  // ✅ 로그아웃/세션 전환 시 "개인 UI 상태" 전체 초기화용
  resetAll: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  totals: {},
  itemCounts: {},

  addPrice: (restaurantId, delta) =>
    set((state) => {
      const prev = state.totals[restaurantId] ?? 0;
      const next = Math.max(0, prev + delta);
      return { totals: { ...state.totals, [restaurantId]: next } };
    }),

  resetTotal: (restaurantId) =>
    set((state) => ({
      totals: { ...state.totals, [restaurantId]: 0 },
    })),

  increaseItem: (restaurantId, menuId) =>
    set((state) => {
      const byR = state.itemCounts[restaurantId] ?? {};
      return {
        itemCounts: {
          ...state.itemCounts,
          [restaurantId]: {
            ...byR,
            [menuId]: (byR[menuId] ?? 0) + 1,
          },
        },
      };
    }),

  decreaseItem: (restaurantId, menuId) =>
    set((state) => {
      const byR = state.itemCounts[restaurantId] ?? {};
      const next = (byR[menuId] ?? 0) - 1;

      const nextByR =
        next <= 0
          ? (() => {
              const { [menuId]: _, ...rest } = byR;
              return rest;
            })()
          : { ...byR, [menuId]: next };

      return {
        itemCounts: {
          ...state.itemCounts,
          [restaurantId]: nextByR,
        },
      };
    }),

  resetItems: (restaurantId) =>
    set((state) => ({
      itemCounts: { ...state.itemCounts, [restaurantId]: {} },
    })),

  resetAll: () => set({ totals: {}, itemCounts: {} }),
}));