import { prisma } from "../db";

import { Prisma } from "@prisma/client";

export async function listRestaurants(query?: string) {
  const q = (query ?? "").trim();

  const where: Prisma.RestaurantWhereInput = q
    ? {
        name: { contains: q }, // SQLite면 mode 없이 먼저!
      }
    : {};

  return prisma.restaurant.findMany({
    where,
    orderBy: { id: "asc" },
    take: 30, // ✅ 너무 많으면 제한 (원하면 숫자 조절)
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      minOrderPrice: true,
      pendingPrice: true,
    },
  });
}

export async function getRestaurant(restaurantId: number) {
  return prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      minOrderPrice: true,
      pendingPrice: true,
    },
  });
}

export async function getRestaurantMenus(restaurantId: number) {
  return prisma.menu.findMany({
    where: { restaurantId },
    orderBy: { id: "asc" },
    select: {
      id: true,
      name: true,
      price: true,
      amountOrdered: true,
      restaurantId: true,
    },
  });
}

export async function patchMenuAmount(
  restaurantId: number,
  menuId: number,
  delta: 1 | -1
) {
  return prisma.$transaction(async (tx) => {
    const menu = await tx.menu.findUnique({
      where: { id: menuId },
      select: {
        id: true,
        restaurantId: true,
        price: true,
        amountOrdered: true,
        name: true,
      },
    });

    if (!menu) throw new Error("MENU_NOT_FOUND");
    if (menu.restaurantId !== restaurantId) throw new Error("RESTAURANT_MISMATCH");

    // amountOrdered 음수 방지
    const nextAmount = Math.max(0, menu.amountOrdered + delta);

    // delta=-1인데 이미 0이면 변화 없음
    const effectiveDelta =
      delta === -1 && menu.amountOrdered <= 0 ? 0 : delta;

    const priceDelta = menu.price * effectiveDelta;

    const restaurant = await tx.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, pendingPrice: true, minOrderPrice: true },
    });

    if (!restaurant) throw new Error("MENU_NOT_FOUND");

    const nextPending = Math.max(0, restaurant.pendingPrice + priceDelta);

    const [updatedMenu, updatedRestaurant] = await Promise.all([
      tx.menu.update({
        where: { id: menuId },
        data: { amountOrdered: nextAmount },
        select: {
          id: true,
          restaurantId: true,
          name: true,
          price: true,
          amountOrdered: true,
        },
      }),
      tx.restaurant.update({
        where: { id: restaurantId },
        data: { pendingPrice: nextPending },
        select: {
          id: true,
          pendingPrice: true,
          minOrderPrice: true,
        },
      }),
    ]);

    return {
      ok: true,
      delta: effectiveDelta,
      menu: updatedMenu,
      restaurant: updatedRestaurant,
    };
  });
}

/**
 * ✅ 주문 접수(초기화)
 * - restaurant.pendingPrice = 0
 * - menu.amountOrdered 모두 0
 */
export async function checkoutCart(restaurantId: number) {
  return prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, pendingPrice: true, minOrderPrice: true },
    });
    if (!restaurant) throw new Error("RESTAURANT_NOT_FOUND");

    await tx.menu.updateMany({
      where: { restaurantId },
      data: { amountOrdered: 0 },
    });

    const updatedRestaurant = await tx.restaurant.update({
      where: { id: restaurantId },
      data: { pendingPrice: 0 },
      select: { id: true, pendingPrice: true, minOrderPrice: true },
    });

    return { ok: true, restaurant: updatedRestaurant };
  });
}