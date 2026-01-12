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

// ✅ 공동 장바구니 금액 조회
export async function readRestaurantState(restaurantId: number) {
  return prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      minOrderPrice: true,
      pendingPrice: true,
      updatedAt: true,
    },
  });
}

// ✅ 공동 장바구니 금액 증감 (0 밑으로 내려가지 않게)
export async function applyPendingPriceDelta(restaurantId: number, delta: number) {
  return prisma.$transaction(async (tx) => {
    const r = await tx.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, pendingPrice: true, minOrderPrice: true },
    });
    if (!r) throw new Error("Restaurant not found");

    const nextPending = Math.max(0, (r.pendingPrice ?? 0) + delta);

    const updated = await tx.restaurant.update({
      where: { id: restaurantId },
      data: { pendingPrice: nextPending },
      select: { id: true, pendingPrice: true, minOrderPrice: true, updatedAt: true },
    });

    return updated;
  });
}

// ✅ 주문 접수 처리: pendingPrice 0으로 리셋
export async function resetPendingPrice(restaurantId: number) {
  const updated = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { pendingPrice: 0 },
    select: { id: true, pendingPrice: true, minOrderPrice: true, updatedAt: true },
  });
  return updated;
}