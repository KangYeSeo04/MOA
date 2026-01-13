import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

export interface AuthedRequest extends Request {
  userId?: number;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;

  console.log("AUTH =", auth);
  console.log("JWT_SECRET =", process.env.JWT_SECRET);

  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const token = auth.slice("Bearer ".length).trim();
    const secret = process.env.JWT_SECRET; // ✅ ! 쓰지 말자
    if (!secret) {
      console.log("❌ JWT_SECRET missing");
      return res.status(500).json({ message: "Server auth misconfigured" });
    }

    const decoded = jwt.verify(token, secret) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch (e) {
    console.log("❌ verify failed:", e);
    return res.status(401).json({ message: "Invalid token" });
  }
}

