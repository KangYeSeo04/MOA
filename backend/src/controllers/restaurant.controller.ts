import type { Request, Response } from "express";
import {
  getRestaurant,
  getRestaurantMenus,
  listRestaurants,
  patchMenuAmount,
  checkoutCart,
} from "../services/restaurant.service";

export async function getRestaurants(_req: Request, res: Response) {
  try {
    const restaurants = await listRestaurants();
    res.json(restaurants);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e?.message ?? "Internal Server Error" });
  }
}

export async function getRestaurantById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid restaurant id" });

    const r = await getRestaurant(id);
    if (!r) return res.status(404).json({ message: "Restaurant not found" });

    res.json(r);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e?.message ?? "Internal Server Error" });
  }
}

export async function getMenusByRestaurant(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ message: "Invalid restaurant id" });

    const menus = await getRestaurantMenus(id);
    res.json(menus);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ message: e?.message ?? "Internal Server Error" });
  }
}

export async function patchMenuAmountOrdered(req: Request, res: Response) {
  try {
    const rid = Number(req.params.rid);
    const mid = Number(req.params.mid);

    if (Number.isNaN(rid) || Number.isNaN(mid)) {
      return res.status(400).json({ message: "Invalid rid/mid" });
    }

    const { delta } = req.body as { delta?: number };
    if (delta !== 1 && delta !== -1) {
      return res.status(400).json({ message: "delta must be 1 or -1" });
    }

    const result = await patchMenuAmount(rid, mid, delta);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("patchMenuAmountOrdered ERROR:", err);

    if (err instanceof Error && err.message === "MENU_NOT_FOUND") {
      return res.status(404).json({ message: "Menu not found" });
    }
    if (err instanceof Error && err.message === "RESTAURANT_MISMATCH") {
      return res.status(400).json({ message: "Menu does not belong to restaurant" });
    }

    return res.status(500).json({ message: err?.message ?? "Internal Server Error" });
  }
}

/**
 * ✅ POST /restaurants/:rid/checkout
 * - Restaurant.pendingPrice = 0
 * - Menu.amountOrdered 전부 0
 */
export async function checkoutRestaurant(req: Request, res: Response) {
  try {
    const rid = Number(req.params.rid);
    if (Number.isNaN(rid)) return res.status(400).json({ message: "Invalid restaurant id" });

    const result = await checkoutCart(rid);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("checkoutRestaurant ERROR:", err);
    if (err instanceof Error && err.message === "RESTAURANT_NOT_FOUND") {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    return res.status(500).json({ message: err?.message ?? "Internal Server Error" });
  }
}