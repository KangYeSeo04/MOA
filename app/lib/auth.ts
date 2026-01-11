import { API_BASE } from "../../constants/api";
import * as SecureStore from "expo-secure-store";
const KEY = "moa_token";

export const setToken = (t: string) => SecureStore.setItemAsync(KEY, t);
export const getToken = () => SecureStore.getItemAsync(KEY);
export const clearToken = () => SecureStore.deleteItemAsync(KEY);

type SignupInput = {
  username: string;
  email: string;
  phone: string;
  password: string;
};

type LoginInput = {
  identifier: string; // ✅ username 또는 email
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
    const msg = await parseError(res);
    throw new Error(msg);
  }

  return res.json().catch(() => null);
}

export async function login(input: LoginInput) {
  const id = (input.identifier ?? "").trim();

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // ✅ 백엔드가 뭘 받든 되도록 다 보내기
    body: JSON.stringify({
      identifier: id,
      username: id,
      email: id,
      password: input.password,
    }),
  });

  if (!res.ok) {
    const msg = await parseError(res);
    throw new Error(msg);
  }

  return res.json().catch(() => null);
}


