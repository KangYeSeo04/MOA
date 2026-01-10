import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';

// 여기서 회원가입을 처리하는 실제 로직을 추가할 수 있어.
export const signup = async (req: Request, res: Response) => {
  try {
    // 회원가입 로직
    const { email, password, nickname } = req.body as {
        email?: string;
        password?: string;
        nickname?: string;
      };

    // 예시: 실제 DB에 저장하는 로직 (여기선 간단히 로그만 출력)
    const user = await authService.signup(email ?? '', password ?? '', nickname ?? '');
    return res.status(201).json(user);
  } catch (err) {
    if (err instanceof Error) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(400).json({ message: 'Unknown error' });
  }
};
