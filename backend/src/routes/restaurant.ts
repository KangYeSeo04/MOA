import { Router } from "express";
import {
  getMenusByRestaurant,
  getRestaurants,
  getRestaurantById,
  patchMenuAmountOrdered,
  checkoutRestaurant,
} from "../controllers/restaurant.controller";

const router = Router();

// GET /restaurants
router.get("/", getRestaurants);

// ✅ GET /restaurants/:id  (pendingPrice/minOrderPrice 확인용)
router.get("/:id", getRestaurantById);

// GET /restaurants/:id/menus
router.get("/:id/menus", getMenusByRestaurant);

// PATCH /restaurants/:rid/menus/:mid/amount  body: { delta: 1 | -1 }
router.patch("/:rid/menus/:mid/amount", patchMenuAmountOrdered);

// ✅ POST /restaurants/:rid/checkout  (주문 접수 → DB 초기화)
router.post("/:rid/checkout", checkoutRestaurant);

export default router;