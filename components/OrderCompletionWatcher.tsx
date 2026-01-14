import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { router, usePathname } from "expo-router";

import { API_BASE } from "../constants/api";
import { useAuthStore } from "../stores/auth";
import { useCartStore } from "../stores/cart";
import {
  appendOrderHistory,
  consumeOrderCompletionInitiated,
  formatOrderDate,
  resolveOrderUserKey,
  type OrderHistoryEntry,
} from "../app/lib/orderHistory";
import { setPendingOrder } from "../app/lib/pendingOrder";

const POLL_MS = 1200;

type RestaurantState = {
  pendingPrice?: number;
  minOrderPrice?: number;
};

export function OrderCompletionWatcher() {
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [userKey, setUserKey] = useState<string | null>(null);

  const itemCountsByUser = useCartStore((s) => s.itemCountsByUser);
  const menuCacheByRestaurant = useCartStore((s) => s.menuCacheByRestaurant);
  const restaurantMetaById = useCartStore((s) => s.restaurantMetaById);
  const setTotal = useCartStore((s) => s.setTotal);
  const setRestaurantMeta = useCartStore((s) => s.setRestaurantMeta);
  const resetRestaurantItemsForAllUsers = useCartStore(
    (s) => s.resetRestaurantItemsForAllUsers
  );

  useEffect(() => {
    if (!hydrated || !token) {
      setUserKey(null);
      return;
    }

    resolveOrderUserKey()
      .then((key) => setUserKey(key))
      .catch(() => setUserKey("guest"));
  }, [hydrated, token]);

  const trackedRestaurantIds = useMemo(() => {
    if (!userKey) return [];
    const byRestaurant = itemCountsByUser[userKey] ?? {};

    return Object.entries(byRestaurant)
      .filter(([, items]) => Object.values(items).some((qty) => qty > 0))
      .map(([rid]) => Number(rid))
      .filter((rid) => Number.isFinite(rid));
  }, [itemCountsByUser, userKey]);

  const lastPendingRef = useRef<Record<number, number | null>>({});
  const alertingRef = useRef(false);

  const buildOrderEntry = useCallback(
    (restaurantId: number): OrderHistoryEntry | null => {
      if (!userKey) return null;
      const counts = itemCountsByUser[userKey]?.[restaurantId];
      if (!counts) return null;

      const menuById = menuCacheByRestaurant[restaurantId];
      if (!menuById) return null;

      const entries = Object.entries(counts).filter(([, qty]) => qty > 0);
      if (entries.length === 0) return null;

      const orderItems: string[] = [];
      let totalPrice = 0;
      let thumbnail: string | number | undefined;

      for (const [menuId, qty] of entries) {
        const menu = menuById[menuId];
        if (!menu) continue;

        orderItems.push(qty > 1 ? `${menu.name} x${qty}` : menu.name);
        totalPrice += menu.price * qty;

        if (!thumbnail && menu.image) {
          thumbnail = menu.image;
        }
      }

      if (orderItems.length === 0) return null;

      const restaurantName = restaurantMetaById[restaurantId]?.name ?? "메뉴";

      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        restaurantName,
        restaurantImage: thumbnail,
        items: orderItems,
        totalPrice,
        orderDate: formatOrderDate(new Date()),
        status: "delivered",
      };
    },
    [itemCountsByUser, menuCacheByRestaurant, restaurantMetaById, userKey]
  );

  useEffect(() => {
    if (!hydrated || !token) return;
    if (!userKey) return;
    if (trackedRestaurantIds.length === 0) return;
    if (pathname === "/menu") return;

    let dead = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        await Promise.all(
          trackedRestaurantIds.map(async (restaurantId) => {
            const res = await fetch(
              `${API_BASE}/restaurants/${restaurantId}/state`
            );
            if (!res.ok) return;

            const st = (await res.json()) as RestaurantState;
            if (dead) return;

            if (typeof st?.pendingPrice === "number") {
              setTotal(restaurantId, st.pendingPrice);
            }

            if (typeof st?.minOrderPrice === "number" && st.minOrderPrice > 0) {
              setRestaurantMeta(restaurantId, {
                minOrderPrice: st.minOrderPrice,
              });
            }

            const currentPending =
              typeof st?.pendingPrice === "number" ? st.pendingPrice : null;
            const prevPending = lastPendingRef.current[restaurantId] ?? null;
            if (currentPending !== null) {
              lastPendingRef.current[restaurantId] = currentPending;
            }

            const shouldCheckCompletion =
              currentPending === 0 && (prevPending === null || prevPending > 0);
            if (!shouldCheckCompletion) return;

            const skip = await consumeOrderCompletionInitiated(
              userKey,
              restaurantId
            );
            if (skip) return;

            const entry = buildOrderEntry(restaurantId);
            if (!entry) return;

            await setPendingOrder({
              userKey,
              restaurantId,
              restaurantName: entry.restaurantName,
              minOrderPrice:
                typeof st?.minOrderPrice === "number" && st.minOrderPrice > 0
                  ? st.minOrderPrice
                  : restaurantMetaById[restaurantId]?.minOrderPrice ?? 0,
              orderEntry: entry,
              createdAt: Date.now(),
            }).catch(() => {});

            await appendOrderHistory(userKey, entry);
            resetRestaurantItemsForAllUsers(restaurantId);

            if (alertingRef.current) return;
            alertingRef.current = true;

            Alert.alert(
              "결제 요청",
              "모아친구가 주문을 완료했어요.\n결제페이지에서 확인해 주세요.",
              [
                {
                  text: "확인",
                  onPress: () => {
                    alertingRef.current = false;
                    router.push("/payment");
                  },
                },
              ]
            );
          })
        );
      } catch {
        // 네트워크 에러는 조용히 재시도
      } finally {
        if (!dead) timer = setTimeout(tick, POLL_MS);
      }
    };

    tick();

    return () => {
      dead = true;
      if (timer) clearTimeout(timer);
    };
  }, [
    hydrated,
    token,
    userKey,
    trackedRestaurantIds,
    pathname,
    setTotal,
    setRestaurantMeta,
    resetRestaurantItemsForAllUsers,
    buildOrderEntry,
    restaurantMetaById,
  ]);

  return null;
}
