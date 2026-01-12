import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthedRequest } from "../middlewares/requireAuth";
import * as bcrypt from "bcrypt";

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

router.patch("/me", requireAuth, async (req: AuthedRequest, res) => {
    const nickname = (req.body?.nickname ?? "").toString().trim();
    if (!nickname) {
      return res.status(400).json({ message: "nickname is required" });
    }
  
    const updated = await prisma.user.update({
      where: { id: req.userId! },
      data: { nickname },
      select: { id: true, username: true, email: true, phone: true, nickname: true },
    });
  
    res.json(updated);
  });

  router.patch("/password", requireAuth, async (req: AuthedRequest, res) => {
    const currentPassword = (req.body?.currentPassword ?? "").toString();
    const newPassword = (req.body?.newPassword ?? "").toString();
  
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ message: "비밀번호는 최소 4자 이상이어야 합니다." });
    }
  
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, pw: true },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
  
    const ok = await bcrypt.compare(currentPassword, user.pw);
    if (!ok) {
      return res.status(400).json({ message: "현재 비밀번호가 올바르지 않습니다." });
    }
  
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId! },
      data: { pw: hashed },
    });


    console.log("password changed for user", req.userId);
    res.json({ ok: true });
  });

  router.post("/verify-password", requireAuth, async (req: AuthedRequest, res) => {
    const currentPassword = (req.body?.currentPassword ?? "").toString();
    if (!currentPassword) {
      return res.status(400).json({ message: "currentPassword is required" });
    }
  
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { pw: true },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
  
    const ok = await bcrypt.compare(currentPassword, user.pw);
    if (!ok) return res.status(400).json({ message: "현재 비밀번호가 올바르지 않습니다." });
  
    return res.json({ ok: true });
  });