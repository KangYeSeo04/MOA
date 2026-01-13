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
      restaurantId_name: { restaurantId: pepes.id, name: "루꼴라 샐러드" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "루꼴라 샐러드",
      price: 8000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "시저 샐러드" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "시저 샐러드",
      price: 11000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "화이트 라구" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "화이트 라구",
      price: 16000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "채끝 스테이크" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "채끝 스테이크",
      price: 32000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "치아바타" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "치아바타",
      price: 3000,
      amountOrdered: 0,
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

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "매쉬드 포테이토" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "매쉬드 포테이토",
      price: 20000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "바질 크림 뇨끼" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "바질 크림 뇨끼",
      price: 20000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "콜라" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "콜라",
      price: 2000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "제로콜라" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "제로콜라",
      price: 2000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "스프라이트" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "스프라이트",
      price: 2000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "산펠레그리노" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "산펠레그리노",
      price: 3000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "담레몬" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "담레몬",
      price: 6000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "하이네켄" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "하이네켄",
      price: 7000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "레드와인" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "레드와인",
      price: 33000,
      amountOrdered: 0,
    },
  });

  await prisma.menu.upsert({
    where: {
      restaurantId_name: { restaurantId: pepes.id, name: "화이트와인" },
    },
    update: {},
    create: {
      restaurantId: pepes.id,
      name: "화이트와인",
      price: 33000,
      amountOrdered: 0,
    },
  });

  console.log("✅ Seed 완료: 모수 + 페페스 파스타 데이터 반영");
  console.log("SEED DATABASE_URL =", process.env.DATABASE_URL);

}

main()
  .catch((e) => {
    console.error("❌ Seed 실패", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });