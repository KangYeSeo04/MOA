import { prisma } from "../db";

export async function listRestaurants() {
  return prisma.restaurant.findMany({
    orderBy: { id: "asc" },
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

// ✅ 메뉴 공동 수량(amountOrdered) 증감 (0 밑으로 내려가지 않게)
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

// ✅ 주문 완료: pendingPrice=0 + 해당 매장 메뉴 amountOrdered 전부 0
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