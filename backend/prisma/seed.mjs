import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  /* =========================
   * 식당 1: 모수
   * ========================= */
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
      restaurantId_name: { restaurantId: mosu.id, name: "잉걸불에 태운 도토리 국수" },
    },
    update: {},
    create: {
      restaurantId: mosu.id,
      name: "잉걸불에 태운 도토리 국수",
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

  /* =========================
   * 식당 2: 을지로 김밥집 (추가)
   * ========================= */
  const pepes = await prisma.restaurant.upsert({
    where: { name: "페페스 파스타" },
    update: {},
    create: {
      name: "페페스 파스타",
      latitude: 36.36088,
      longitude: 127.34971,
      minOrderPrice: 25000,
      pendingPrice: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "봉골레" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "봉골레",
      price: 12000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "까르보나라" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "까르보나라",
      price: 12000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "카치오 에 페페" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "카치오 에 페페",
      price: 12000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "앤쵸비 오일" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "앤쵸비 오일",
      price: 12000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "라구" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "라구",
      price: 16000,
      amountOrdered: 0,
    },
  });

  console.log("✅ Seed 완료: 모수 + 페페스 파스타 데이터 반영");
}

main()
  .catch((e) => {
    console.error("❌ Seed 실패", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });