import AsyncStorage from "@react-native-async-storage/async-storage";

export type PaymentMethod = {
  label: string;
  last4: string;
};

const PAYMENT_METHOD_KEY = "payment_method_v1";

export async function getPaymentMethod() {
  const raw = await AsyncStorage.getItem(PAYMENT_METHOD_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PaymentMethod | null;
    if (!parsed?.label || !parsed?.last4) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setPaymentMethod(method: PaymentMethod) {
  await AsyncStorage.setItem(PAYMENT_METHOD_KEY, JSON.stringify(method));
}

export async function clearPaymentMethod() {
  await AsyncStorage.removeItem(PAYMENT_METHOD_KEY);
}
