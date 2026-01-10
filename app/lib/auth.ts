// app/lib/auth.ts
import { API_BASE_URL } from "./api";

type SignupParams = {
  username: string;
  email: string;
  phone: string;
  password: string;
};

export async function signup(params: SignupParams) {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message ?? "회원가입 실패");
  return data;
}

export async function login(params: { username: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message ?? "로그인 실패");
  return data;
}
