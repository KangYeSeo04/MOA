import type { Request, Response } from "express";
import {
  getRestaurantMenus,
  listRestaurants,
  readRestaurantState,
  applyPendingPriceDelta,
  resetPendingPrice,
} from "../services/restaurant.service";

export async function getRestaurants(req: Request, res: Response) {
  const restaurants = await listRestaurants();
  res.json(restaurants);
}

export async function getMenusByRestaurant(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid restaurant id" });

  const menus = await getRestaurantMenus(id);
  res.json(menus);
}

// ✅ GET /restaurants/:id/state
export async function getRestaurantState(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid restaurant id" });

  const state = await readRestaurantState(id);
  if (!state) return res.status(404).json({ message: "Restaurant not found" });
  res.json(state);
}

// ✅ PATCH /restaurants/:id/pendingPrice { delta }
export async function patchPendingPrice(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid restaurant id" });

  const { delta } = req.body as { delta?: number };
  if (typeof delta !== "number" || !Number.isFinite(delta)) {
    return res.status(400).json({ message: "delta must be a number" });
  }

  const next = await applyPendingPriceDelta(id, delta);
  return res.json(next);
}

// ✅ POST /restaurants/:id/complete
export async function completeOrder(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid restaurant id" });

  const next = await resetPendingPrice(id);
  return res.json(next);
}