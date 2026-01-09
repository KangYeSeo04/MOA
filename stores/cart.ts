import { create } from "zustand";

type CartState = {
  totals: Record<number, number>; // restaurantId -> 담은 금액 합계
  addPrice: (restaurantId: number, price: number) => void;
  resetTotal: (restaurantId: number) => void;
};

export const useCartStore = create<CartState>((set) => ({
  totals: {},
  addPrice: (restaurantId, price) =>
    set((state) => ({
      totals: {
        ...state.totals,
        [restaurantId]: (state.totals[restaurantId] ?? 0) + price,
      },
    })),
  resetTotal: (restaurantId) =>
    set((state) => ({
      totals: { ...state.totals, [restaurantId]: 0 },
    })),
}));