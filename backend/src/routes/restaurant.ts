import { Router } from "express";
import {
  getMenusByRestaurant,
  getRestaurants,
  getRestaurantState,
  patchPendingPrice,
  completeOrder,
} from "../controllers/restaurant.controller";

const router = Router();

router.get("/", getRestaurants);                 // GET /restaurants
router.get("/:id/menus", getMenusByRestaurant);  // GET /restaurants/:id/menus

// ✅ 공동 장바구니(금액) 상태 조회
router.get("/:id/state", getRestaurantState);    // GET /restaurants/:id/state

// ✅ 공동 장바구니(금액) 증감
router.patch("/:id/pendingPrice", patchPendingPrice); // PATCH /restaurants/:id/pendingPrice { delta }

// ✅ 주문 접수(공동 금액 0으로 리셋)
router.post("/:id/complete", completeOrder);     // POST /restaurants/:id/complete

export default router;