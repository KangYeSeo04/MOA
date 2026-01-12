// backend/src/services/restaurant.service.ts
import { prisma } from "../db";
import { Prisma } from "@prisma/client";

// GET /restaurants?query=...
export async function listRestaurants(query?: string) {
  const q = (query ?? "").trim();

  const where: Prisma.RestaurantWhereInput = q
    ? { name: { contains: q } } // SQLite: mode 없음
    : {};

  return prisma.restaurant.findMany({
    where,
    orderBy: { id: "asc" },
    take: 30,
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

// GET /restaurants/:id/menus
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

// GET /restaurants/:id/state
export async function readRestaurantState(restaurantId: number) {
  return prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      pendingPrice: true,
      minOrderPrice: true,
    },
  });
}

// PATCH /restaurants/:id/pendingPrice  body: { delta }
export async function updateRestaurantPendingPrice(restaurantId: number, delta: number) {
  const r = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, pendingPrice: true, minOrderPrice: true },
  });
  if (!r) return null;

  const next = Math.max(0, Number(r.pendingPrice ?? 0) + Number(delta));

  return prisma.restaurant.update({
    where: { id: restaurantId },
    data: { pendingPrice: next },
    select: { id: true, pendingPrice: true, minOrderPrice: true },
  });
}

// PATCH /restaurants/:id/menus/:menuId/amountOrdered  body: { delta } (delta=+1/-1)
export async function updateMenuAmountOrdered(
  restaurantId: number,
  menuId: number,
  delta: number
) {
  const m = await prisma.menu.findFirst({
    where: { id: menuId, restaurantId },
    select: { id: true, amountOrdered: true, restaurantId: true },
  });
  if (!m) return null;

  const next = Math.max(0, Number(m.amountOrdered ?? 0) + Number(delta));

  return prisma.menu.update({
    where: { id: menuId },
    data: { amountOrdered: next },
    select: { id: true, restaurantId: true, amountOrdered: true },
  });
}

// POST /restaurants/:id/complete
// pendingPrice=0 + 해당 매장의 모든 메뉴 amountOrdered=0
export async function completeRestaurant(restaurantId: number) {
  const r = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, minOrderPrice: true },
  });
  if (!r) return null;

  return prisma.$transaction(async (tx) => {
    await tx.restaurant.update({
      where: { id: restaurantId },
      data: { pendingPrice: 0 },
    });

    await tx.menu.updateMany({
      where: { restaurantId },
      data: { amountOrdered: 0 },
    });

    return tx.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, pendingPrice: true, minOrderPrice: true },
    });
  });
}