import * as bcrypt from 'bcrypt';
import { prisma } from '../db';

export const signup = async (email: string, password: string, nickname: string) => {
  if (!email || !password || !nickname) {
    throw new Error('email, password, nickname are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const trimmedNickname = nickname.trim();

  if (password.length < 4) {
    throw new Error('password must be at least 4 characters');
  }

  // 이메일 중복 체크
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existing) {
    throw new Error('Email already exists');
  }

  // 비밀번호 해시
  const passwordHash = await bcrypt.hash(password, 10);

  // DB 저장
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      pw: passwordHash,
      nickname: trimmedNickname,
    },
    select: {
      id: true,
      email: true,
      nickname: true,
      createdAt: true,
    },
  });

  return user;
};
