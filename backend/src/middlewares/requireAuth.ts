import { Request, Response, NextFunction } from "express";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const jwt = require("jsonwebtoken") as typeof import("jsonwebtoken");

export interface AuthedRequest extends Request {
  userId?: number;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;

  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "Server auth misconfigured" });
  }

  try {
    const token = auth.slice("Bearer ".length).trim();
    const decoded = jwt.verify(token, secret) as { userId: number };
    req.userId = decoded.userId;
    return next();
  } catch (e) {
    console.log("❌ verify failed:", e);
    return res.status(401).json({ message: "Invalid token" });
  }
}
