import { Router } from "express";
import { requireAuth, AuthedRequest } from "../middlewares/requireAuth";
import * as bcrypt from "bcrypt";
import { prisma } from "../db";

const router = Router();

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      nickname: true,
      address: true, // ✅ 추가
    },
  });

  if (!me) return res.status(404).json({ message: "User not found" });
  res.json(me);
});

// ✅ 닉네임/주소 둘 다 업데이트 (있으면 반영)
router.patch("/me", requireAuth, async (req: AuthedRequest, res) => {
  const nicknameRaw = req.body?.nickname;
  const addressRaw = req.body?.address;

  const nickname =
    typeof nicknameRaw === "string" ? nicknameRaw.trim() : undefined;
  const address =
    typeof addressRaw === "string" ? addressRaw.trim() : undefined;

  // 아무것도 안 보내면 에러
  if (nickname === undefined && address === undefined) {
    return res.status(400).json({ message: "nickname or address is required" });
  }

  // 빈 문자열은 막기(원하면 address는 빈값 허용해도 됨)
  if (nickname !== undefined && !nickname) {
    return res.status(400).json({ message: "nickname must not be empty" });
  }
  if (address !== undefined && !address) {
    return res.status(400).json({ message: "address must not be empty" });
  }

  const updated = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      ...(nickname !== undefined ? { nickname } : {}),
      ...(address !== undefined ? { address } : {}),
    },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      nickname: true,
      address: true, // ✅ 추가
    },
  });

  res.json(updated);
});

router.patch("/password", requireAuth, async (req: AuthedRequest, res) => {
  const currentPassword = (req.body?.currentPassword ?? "").toString();
  const newPassword = (req.body?.newPassword ?? "").toString();

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "currentPassword and newPassword are required" });
  }
  if (newPassword.length < 4) {
    return res
      .status(400)
      .json({ message: "비밀번호는 최소 4자 이상이어야 합니다." });
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
  if (!ok)
    return res.status(400).json({ message: "현재 비밀번호가 올바르지 않습니다." });

  return res.json({ ok: true });
});

export default router;
