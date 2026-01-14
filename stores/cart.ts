// stores/cart.ts
import { create } from "zustand";

type CartState = {
  // ✅ 공동 금액 (restaurantId -> total)  ※ 서버 pendingPrice를 주기적으로 반영
  totals: Record<number, number>;

  // ✅ 유저별 수량 (userKey -> restaurantId -> (menuId -> qty))
  itemCountsByUser: Record<string, Record<number, Record<string, number>>>;

  // ✅ 메뉴 캐시 (restaurantId -> menuId -> meta)
  menuCacheByRestaurant: Record<number, Record<string, MenuCacheItem>>;

  // ✅ 매장 메타 (restaurantId -> meta)
  restaurantMetaById: Record<number, RestaurantMeta>;

  // ✅ 서버 값으로 total 강제 세팅 (polling 결과 반영)
  setTotal: (restaurantId: number, total: number) => void;

  // (기존 호환용) 로컬에서 더/빼기도 가능하지만, 이제는 서버 동기화가 주도권 가짐
  addPrice: (restaurantId: number, delta: number) => void;
  resetTotal: (restaurantId: number) => void;

  increaseItem: (userKey: string, restaurantId: number, menuId: string) => void;
  decreaseItem: (userKey: string, restaurantId: number, menuId: string) => void;
  resetItems: (userKey: string, restaurantId: number) => void;

  // ✅ 주문 접수(공동) 시 해당 매장의 모든 유저 수량 초기화
  resetRestaurantItemsForAllUsers: (restaurantId: number) => void;

  // ✅ 메뉴/매장 정보 캐시
  setMenuCache: (restaurantId: number, items: MenuCacheItem[]) => void;
  setRestaurantMeta: (restaurantId: number, meta: RestaurantMeta) => void;
};

export type MenuCacheItem = {
  id: string;
  name: string;
  price: number;
  image?: string | number;
};

export type RestaurantMeta = {
  name?: string;
  minOrderPrice?: number;
};

export const useCartStore = create<CartState>((set) => ({
  totals: {},
  itemCountsByUser: {},
  menuCacheByRestaurant: {},
  restaurantMetaById: {},

  setTotal: (restaurantId, total) =>
    set((state) => ({
      totals: { ...state.totals, [restaurantId]: Math.max(0, Number(total) || 0) },
    })),

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

  setMenuCache: (restaurantId, items) =>
    set((state) => {
      const byId: Record<string, MenuCacheItem> = {};
      for (const item of items) {
        byId[item.id] = item;
      }
      return {
        menuCacheByRestaurant: {
          ...state.menuCacheByRestaurant,
          [restaurantId]: byId,
        },
      };
    }),

  setRestaurantMeta: (restaurantId, meta) =>
    set((state) => ({
      restaurantMetaById: {
        ...state.restaurantMetaById,
        [restaurantId]: {
          ...state.restaurantMetaById[restaurantId],
          ...meta,
        },
      },
    })),
}));
