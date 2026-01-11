import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthedRequest } from "../middlewares/requireAuth";

const router = Router();
const prisma = new PrismaClient();

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, username: true, email: true, phone: true, nickname: true },
  });
  if (!me) return res.status(404).json({ message: "User not found" });
  res.json(me);
});

export default router;
