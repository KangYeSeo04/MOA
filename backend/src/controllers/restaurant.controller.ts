// backend/src/controllers/restaurant.controller.ts
import type { Request, Response } from "express";
import {
  getRestaurantMenus,
  listRestaurants,
  readRestaurantState,
  updateRestaurantPendingPrice,
  updateMenuAmountOrdered,
  completeRestaurant,
  // getRestaurant, // ✅ 라우트에서 /restaurants/:id 쓰면 service에 있어야 함. 없으면 주석 유지 or 삭제
} from "../services/restaurant.service";

// GET /restaurants?query=...
export async function getRestaurants(req: Request, res: Response) {
  try {
    const q = String(req.query.query ?? "").trim();
    // ✅ listRestaurants가 query optional 받는 버전이면 이대로 OK
    const restaurants = await listRestaurants(q);
    return res.json(restaurants);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e?.message ?? "Internal Server Error" });
  }
}

/*
// GET /restaurants/:id  (필요하면 사용)
export async function getRestaurantById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid restaurant id" });

    const r = await getRestaurant(id);
    if (!r) return res.status(404).json({ message: "Restaurant not found" });

    return res.json(r);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e?.message ?? "Internal Server Error" });
  }
}
*/

// GET /restaurants/:id/menus
export async function getMenusByRestaurant(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid restaurant id" });

    const menus = await getRestaurantMenus(id);
    return res.json(menus);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e?.message ?? "Internal Server Error" });
  }
}

// GET /restaurants/:id/state
export async function getRestaurantState(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid restaurant id" });

    const st = await readRestaurantState(id);
    if (!st) return res.status(404).json({ message: "Restaurant not found" });

    return res.json(st);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e?.message ?? "Internal Server Error" });
  }
}

// PATCH /restaurants/:id/pendingPrice
// body: { delta: number }
export async function patchRestaurantPendingPrice(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid restaurant id" });

    const delta = Number((req.body as any)?.delta);
    if (!Number.isFinite(delta)) return res.status(400).json({ message: "Invalid delta" });

    const st = await updateRestaurantPendingPrice(id, delta);
    if (!st) return res.status(404).json({ message: "Restaurant not found" });

    return res.json(st);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e?.message ?? "Internal Server Error" });
  }
}

// PATCH /restaurants/:id/menus/:menuId/amountOrdered
// body: { delta: number }  (delta=+1/-1)
export async function patchMenuAmountOrdered(req: Request, res: Response) {
  try {
    const restaurantId = Number(req.params.id);
    const menuId = Number(req.params.menuId);
    if (Number.isNaN(restaurantId) || Number.isNaN(menuId)) {
      return res.status(400).json({ message: "Invalid id/menuId" });
    }

    const delta = Number((req.body as any)?.delta);
    if (!Number.isFinite(delta)) return res.status(400).json({ message: "Invalid delta" });

    const updated = await updateMenuAmountOrdered(restaurantId, menuId, delta);
    if (!updated) return res.status(404).json({ message: "Menu not found" });

    return res.json(updated);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e?.message ?? "Internal Server Error" });
  }
}

// POST /restaurants/:id/complete
// 주문 완료: pendingPrice=0 + (서비스에서) 메뉴 amountOrdered 초기화도 처리
export async function completeRestaurantOrder(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid restaurant id" });

    const st = await completeRestaurant(id);
    if (!st) return res.status(404).json({ message: "Restaurant not found" });

    return res.json(st);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e?.message ?? "Internal Server Error" });
  }
}