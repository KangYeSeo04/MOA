import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import restaurantsRoutes from "./routes/restaurant";
import userRouter from "./routes/user";

dotenv.config();

const app = express();

// CORS (팀원 PC에서 접근 실험하려면 아래처럼 열어두는 게 편함)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.use("/user", userRouter);

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/restaurants", restaurantsRoutes);

const PORT = Number(process.env.PORT) || 4000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`); })
// 0.0.0.0 로 바인딩하면 같은 와이파이의 다른 PC/에뮬레이터에서도 접근 