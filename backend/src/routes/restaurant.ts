// backend/src/routes/restaurant.ts
import { Router } from "express";
import {
  getMenusByRestaurant,
  getRestaurants,
  getRestaurantState,
  patchRestaurantPendingPrice,
  patchMenuAmountOrdered,
  completeRestaurantOrder,
} from "../controllers/restaurant.controller";

const router = Router();

// GET /restaurants?query=...
router.get("/", getRestaurants);

// GET /restaurants/:id/menus
router.get("/:id/menus", getMenusByRestaurant);

// GET /restaurants/:id/state
router.get("/:id/state", getRestaurantState);

// PATCH /restaurants/:id/pendingPrice   body: { delta: number }
router.patch("/:id/pendingPrice", patchRestaurantPendingPrice);

// PATCH /restaurants/:id/menus/:menuId/amountOrdered   body: { delta: number } (delta=+1/-1)
router.patch("/:id/menus/:menuId/amountOrdered", patchMenuAmountOrdered);

// POST /restaurants/:id/complete
router.post("/:id/complete", completeRestaurantOrder);

export default router;