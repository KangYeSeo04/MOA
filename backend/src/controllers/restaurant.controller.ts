// backend/src/controllers/restaurant.controller.ts
import type { Request, Response } from "express";
import {
  getRestaurant,
  getRestaurantMenus,
  listRestaurants,
  readRestaurantState,
  updateRestaurantPendingPrice,
  updateMenuAmountOrdered,
  completeRestaurant,
} from "../services/restaurant.service";

// GET /restaurants
export async function getRestaurants(_req: Request, res: Response) {
  try {
    const restaurants = await listRestaurants();
    return res.json(restaurants);
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ message: e?.message ?? "Internal Server Error" });
  }
}

// GET /restaurants/:id
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

// (선택) GET /restaurants/:id/state
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

// body: { delta: number }
// PATCH /restaurants/:id/pendingPrice
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

// body: { delta: number }  (delta=+1/-1)
// PATCH /restaurants/:id/menus/:menuId/amountOrdered
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

// 주문 완료: pendingPrice=0 + 모든 메뉴 amountOrdered=0
// POST /restaurants/:id/complete
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