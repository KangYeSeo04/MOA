import type { Request, Response } from "express";
import { getRestaurantMenus, listRestaurants } from "../services/restaurant.service";

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