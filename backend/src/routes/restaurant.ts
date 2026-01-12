import { Router } from "express";
import {
  getMenusByRestaurant,
  getRestaurants,
  getRestaurantState,
  patchRestaurantPendingPrice,
  completeRestaurantOrder,
  patchMenuAmountOrdered,
} from "../controllers/restaurant.controller";

const router = Router();

router.get("/", getRestaurants);
router.get("/:id/menus", getMenusByRestaurant);

// ✅ 공동 장바구니 상태
router.get("/:id/state", getRestaurantState);

// ✅ 금액 증감 (delta)
router.patch("/:id/pendingPrice", patchRestaurantPendingPrice);

// ✅ 메뉴 수량 증감 (menuId, delta)
router.patch("/:id/menus/:menuId/amountOrdered", patchMenuAmountOrdered);

// ✅ 주문 완료(공동 장바구니 초기화)
router.post("/:id/complete", completeRestaurantOrder);

export default router;