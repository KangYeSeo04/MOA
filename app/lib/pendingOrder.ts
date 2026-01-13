import AsyncStorage from "@react-native-async-storage/async-storage";
import type { OrderHistoryEntry } from "./orderHistory";

export type PendingOrder = {
  userKey: string;
  restaurantId: number;
  restaurantName: string;
  minOrderPrice: number;
  orderEntry: OrderHistoryEntry;
  createdAt: number;
};

const PENDING_ORDER_KEY = "pending_order_v1";

export async function setPendingOrder(order: PendingOrder) {
  await AsyncStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(order));
}

export async function getPendingOrder() {
  const raw = await AsyncStorage.getItem(PENDING_ORDER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingOrder;
  } catch {
    return null;
  }
}

export async function clearPendingOrder() {
  await AsyncStorage.removeItem(PENDING_ORDER_KEY);
}
