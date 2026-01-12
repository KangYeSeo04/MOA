import * as express from "express";
import type { Request, Response } from "express";
import * as cors from "cors";
import * as dotenv from "dotenv";

import authRoutes from "./routes/auth";
import restaurantsRoutes from "./routes/restaurant";
import userRouter from "./routes/user";

dotenv.config();

const app = express();

app.use(cors());
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
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});