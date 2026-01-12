// app/lib/auth.ts
import { API_BASE } from "../../constants/api";

type SignupInput = {
  username: string;
  email: string;
  phone: string;
  password: string;
};

type LoginInput = {
  identifier: string; // username or email
  password: string;
};

async function parseError(res: Response) {
  const text = await res.text().catch(() => "");
  try {
    const json = JSON.parse(text);
    return json?.message || json?.error || text || `HTTP ${res.status}`;
  } catch {
    return text || `HTTP ${res.status}`;
  }
}

export async function signup(input: SignupInput) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: input.username,
      email: input.email,
      phone: input.phone,
      password: input.password,
    }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  // 서버가 user를 반환
  return res.json().catch(() => null);
}

export async function login(input: LoginInput) {
  const id = (input.identifier ?? "").trim();

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // ✅ 백엔드가 무엇을 받든 호환되게 다 실어보냄
      identifier: id,
      username: id,
      email: id,
      password: input.password,
    }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  // ✅ { token, user } 기대
  return res.json().catch(() => null);
}