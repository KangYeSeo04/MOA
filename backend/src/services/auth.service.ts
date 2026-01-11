import * as bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { prisma } from "../db";

export const signup = async (
  username: string,
  email: string,
  phone: string,
  password: string
) => {
  const u = username.trim();
  const e = email.trim().toLowerCase();
  const p = phone.trim();
  const pw = password;

  if (!u || !e || !p || !pw) {
    throw new Error("username, email, phone, password are required");
  }

  const dupUsername = await prisma.user.findUnique({ where: { username: u } });
  if (dupUsername) throw new Error("Username already exists");

  const dupEmail = await prisma.user.findUnique({ where: { email: e } });
  if (dupEmail) throw new Error("Email already exists");

  const hashed = await bcrypt.hash(pw, 10);

  const user = await prisma.user.create({
    data: {
      username: u,
      email: e,
      phone: p,
      pw: hashed,
      // nickname은 optional
    },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      nickname: true,
      createdAt: true,
    },
  });

  return user;
};

/**
 * ✅ 로그인: username 또는 email 둘 다 지원
 * - identifier로 username/email 아무거나 받음
 * - email인 경우 소문자 처리
 */
export const login = async (identifier: string, password: string) => {
  const id = (identifier ?? "").trim();
  const pw = password;

  if (!id || !pw) throw new Error("username/email and password are required");

  // identifier가 email일 수도 있으니 둘 다로 조회
  const isEmail = id.includes("@");
  const normalizedEmail = id.toLowerCase();

  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: normalizedEmail }
      : {
          OR: [{ username: id }, { email: normalizedEmail }],
        },
  });

  if (!user) throw new Error("INVALID_CREDENTIALS");

  const ok = await bcrypt.compare(pw, user.pw);
  if (!ok) throw new Error("INVALID_CREDENTIALS");

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing");

  const token = sign({ userId: user.id }, secret, { expiresIn: "7d" });

  return {
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname },
  };
};