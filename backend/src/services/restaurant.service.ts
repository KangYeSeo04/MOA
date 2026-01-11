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