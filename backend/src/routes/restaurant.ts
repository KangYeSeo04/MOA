import { Router } from "express";
import { getMenusByRestaurant, getRestaurants } from "../controllers/restaurant.controller";

const router = Router();

router.get("/", getRestaurants);            // GET /restaurants
router.get("/:id/menus", getMenusByRestaurant); // GET /restaurants/:id/menus

export default router;