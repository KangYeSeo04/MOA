import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, email, phone, password } = req.body as {
      username?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    const user = await authService.signup(
      username ?? '',
      email ?? '',
      phone ?? '',
      password ?? '',
    );

    return res.status(201).json(user);
  } catch (err) {
    if (err instanceof Error) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(400).json({ message: 'Unknown error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as {
      username?: string;
      password?: string;
    };

    const result = await authService.login(username ?? '', password ?? '');
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ message: '아이디 또는 비밀번호가 잘못됐습니다' });
    }
    if (err instanceof Error) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(400).json({ message: 'Unknown error' });
  }
};
