import { PrismaClient } from '@prisma/client';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaDir = path.resolve(__dirname, "../prisma");

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl || rawUrl.startsWith("file:./") || rawUrl.startsWith("file:../")) {
  const relativePath = rawUrl ? rawUrl.replace(/^file:/, "") : "./dev.db";
  const resolvedPath = path.resolve(schemaDir, relativePath);
  process.env.DATABASE_URL = `file:${resolvedPath}`;
}

export const prisma = new PrismaClient();
