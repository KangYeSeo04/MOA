import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { API_BASE } from "../../constants/api";
import {
  appendOrderHistory,
  clearOrderCompletionInitiated,
  getOrderHistory,
  markOrderCompletionInitiated,
  resolveOrderUserKey,
} from "../lib/orderHistory";
import { getPaymentMethod } from "../lib/paymentMethod";
import {
  clearPendingOrder,
  getPendingOrder,
  type PendingOrder,
} from "../lib/pendingOrder";

type RestaurantState = {
  id: number;
  pendingPrice: number;
  minOrderPrice: number;
};

const ORANGE = "#f57c00";

async function completeOrderOnServer(restaurantId: number) {
  const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`complete failed: ${res.status} ${text}`);
  }

  return (await res.json().catch(() => null)) as RestaurantState | null;
}

export default function PaymentScreen() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<PendingOrder | null>(null);
  const [methodLabel, setMethodLabel] = useState<string>("");

  const load = useCallback(async () => {
    const currentUserKey = await resolveOrderUserKey();
    const pending = await getPendingOrder();
    const method = await getPaymentMethod();

    if (!pending || pending.userKey !== currentUserKey) {
      setOrder(null);
      setMethodLabel("");
      setLoading(false);
      return;
    }

    setOrder(pending);
    setMethodLabel(
      method ? `${method.label} · •••• ${method.last4}` : "결제수단 없음"
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleBack = async () => {
    await clearPendingOrder();
    router.back();
  };

  const handlePay = async () => {
    if (!order || submitting) return;

    try {
      setSubmitting(true);
      await markOrderCompletionInitiated(order.userKey, order.restaurantId);
      await completeOrderOnServer(order.restaurantId);
      const history = await getOrderHistory(order.userKey);
      const exists = history.some((entry) => entry.id === order.orderEntry.id);
      if (!exists) {
        await appendOrderHistory(order.userKey, order.orderEntry);
      }
      await clearPendingOrder();

      Alert.alert("결제 완료", "주문이 완료되었습니다.", [
        {
          text: "확인",
          onPress: () => {
            router.replace({
              pathname: "/menu",
              params: {
                rid: String(order.restaurantId),
                name: order.restaurantName,
                minOrder: String(order.minOrderPrice || 0),
              },
            });
          },
        },
      ]);
    } catch (e: any) {
      await clearOrderCompletionInitiated(order.userKey, order.restaurantId);
      Alert.alert("오류", e?.message ?? "결제 실패");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>결제 정보를 준비 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>결제할 주문이 없습니다</Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnText}>뒤로가기</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>결제</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>결제수단</Text>
          <Text style={styles.cardValue}>{methodLabel}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>결제금액</Text>
          <Text style={styles.priceValue}>
            {order.orderEntry.totalPrice.toLocaleString()}원
          </Text>
          <Text style={styles.caption}>
            {order.orderEntry.items.join(" · ")}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.payBtn,
            submitting && { opacity: 0.7 },
          ]}
          disabled={submitting}
          onPress={handlePay}
        >
          <Text style={styles.payBtnText}>
            {submitting ? "결제 중..." : "결제하기"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F7F9" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "#6B7280", fontSize: 13, fontWeight: "700" },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  primaryBtnText: { color: "white", fontSize: 14, fontWeight: "800" },

  header: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { padding: 6 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },

  content: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  cardTitle: { fontSize: 12, fontWeight: "800", color: "#6B7280" },
  cardValue: { marginTop: 8, fontSize: 15, fontWeight: "800", color: "#111827" },
  priceValue: { marginTop: 8, fontSize: 22, fontWeight: "900", color: "#111827" },
  caption: { marginTop: 8, fontSize: 12, color: "#6B7280", fontWeight: "700" },

  footer: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  payBtn: {
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  payBtnText: { color: "white", fontSize: 16, fontWeight: "900" },
});
