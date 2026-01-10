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
        // nickname은 안 넣어도 됨 (optional)
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

export const login = async (username: string, password: string) => {
  const u = username.trim();
  const pw = password;

  if (!u || !pw) throw new Error("username and password are required");

  const user = await prisma.user.findUnique({
    where: { username: u },
  });

  if (!user) throw new Error("INVALID_CREDENTIALS");

  const ok = await bcrypt.compare(pw, user.pw);
  if (!ok) throw new Error("INVALID_CREDENTIALS");

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing");

  const token = sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
  return {
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname },
  };
};
