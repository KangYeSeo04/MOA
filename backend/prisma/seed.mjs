import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const mosu = await prisma.restaurant.upsert({
    where: { name: "모수" },
    update: {},
    create: {
      name: "모수",
      latitude: 37.5412,
      longitude: 126.9962,
      minOrderPrice: 500000,
      pendingPrice: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: mosu.id, name: "엉길불에 태운 도토리 국수" },
    },
    update: {},
    create: {
      restaurantId: mosu.id,
      name: "엉길불에 태운 도토리 국수",
      price: 100000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: mosu.id, name: "작은 한입들" },
    },
    update: {},
    create: {
      restaurantId: mosu.id,
      name: "작은 한입들",
      price: 100000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: mosu.id, name: "우엉 타르트" },
    },
    update: {},
    create: {
      restaurantId: mosu.id,
      name: "우엉 타르트",
      price: 100000,
      amountOrdered: 0,
    },
  });

  console.log("✅ Seed 완료: 모수 + 메뉴(기존/신규) 반영");
}

main()
  .catch((e) => console.error("❌ Seed 실패", e))
  .finally(async () => prisma.$disconnect());