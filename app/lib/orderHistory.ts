import AsyncStorage from "@react-native-async-storage/async-storage";

export type OrderStatus = "delivered" | "delivering" | "preparing" | "cancelled";

export type OrderHistoryEntry = {
  id: string;
  restaurantName: string;
  restaurantImage?: string | number;
  items: string[];
  totalPrice: number;
  orderDate: string;
  status: OrderStatus;
  deliveryTime?: string;
};

const ORDER_HISTORY_KEY_PREFIX = "order_history_v1";
const USER_KEY_STORAGE = "auth_user_key";
const ORDER_COMPLETION_FLAG_PREFIX = "order_completion_initiated_v1";
const ORDER_COMPLETION_TTL_MS = 5 * 60 * 1000;

export async function resolveOrderUserKey() {
  const saved = await AsyncStorage.getItem(USER_KEY_STORAGE);
  const trimmed = saved?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "guest";
}

export function formatOrderDate(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export async function getOrderHistory(userKey: string) {
  const key = `${ORDER_HISTORY_KEY_PREFIX}:${userKey}`;
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OrderHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export async function appendOrderHistory(userKey: string, entry: OrderHistoryEntry) {
  const key = `${ORDER_HISTORY_KEY_PREFIX}:${userKey}`;
  const current = await getOrderHistory(userKey);
  const next = [entry, ...current];
  await AsyncStorage.setItem(key, JSON.stringify(next));
  return next;
}

export async function markOrderCompletionInitiated(
  userKey: string,
  restaurantId: number
) {
  const key = `${ORDER_COMPLETION_FLAG_PREFIX}:${userKey}:${restaurantId}`;
  await AsyncStorage.setItem(key, String(Date.now()));
}

export async function clearOrderCompletionInitiated(
  userKey: string,
  restaurantId: number
) {
  const key = `${ORDER_COMPLETION_FLAG_PREFIX}:${userKey}:${restaurantId}`;
  await AsyncStorage.removeItem(key);
}

export async function consumeOrderCompletionInitiated(
  userKey: string,
  restaurantId: number
) {
  const key = `${ORDER_COMPLETION_FLAG_PREFIX}:${userKey}:${restaurantId}`;
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return false;

  await AsyncStorage.removeItem(key);

  const ts = Number(raw);
  if (!Number.isFinite(ts)) return true;
  return Date.now() - ts < ORDER_COMPLETION_TTL_MS;
}
