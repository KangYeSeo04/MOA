// app/(tabs)/orders.tsx
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  getOrderHistory,
  resolveOrderUserKey,
  type OrderHistoryEntry,
  type OrderStatus,
} from "../lib/orderHistory";

type Order = OrderHistoryEntry;

const STATUS_LABEL: Record<OrderStatus, string> = {
  delivered: "배달완료",
  delivering: "배달중",
  preparing: "조리중",
  cancelled: "취소",
};

const STATUS_BADGE: Record<OrderStatus, { bg: string; fg: string }> = {
  delivered: { bg: "#E8F5E9", fg: "#1B5E20" },
  delivering: { bg: "#E3F2FD", fg: "#0D47A1" },
  preparing: { bg: "#FFF8E1", fg: "#E65100" },
  cancelled: { bg: "#FFEBEE", fg: "#B71C1C" },
};

const ORANGE = "#f57c00";
const FALLBACK_THUMB = require("../../assets/images/dotori.png");

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  const loadOrders = useCallback(async () => {
    try {
      const userKey = await resolveOrderUserKey();
      const history = await getOrderHistory(userKey);
      setOrders(history);
    } catch {
      setOrders([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  const counts = useMemo(() => {
    const c = {
      all: orders.length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      delivering: orders.filter((o) => o.status === "delivering").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
    return c;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.status === filter);
  }, [filter, orders]);

  const resolveImageSource = (image?: string | number) => {
    if (typeof image === "number") return image;
    if (typeof image === "string" && image.trim()) return { uri: image };
    return FALLBACK_THUMB;
  };

  const filterButtons: { label: string; value: OrderStatus | "all"; count: number }[] = [
    { label: "전체", value: "all", count: counts.all },
    { label: "배달완료", value: "delivered", count: counts.delivered },
    { label: "배달중", value: "delivering", count: counts.delivering },
    { label: "조리중", value: "preparing", count: counts.preparing },
    { label: "취소", value: "cancelled", count: counts.cancelled },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>주문내역</Text>
      </View>

      {/* Filter pills */}
      <View style={styles.filterWrap}>
        <FlatList
          data={filterButtons}
          keyExtractor={(it) => String(it.value)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const active = filter === item.value;
            return (
              <Pressable
                onPress={() => setFilter(item.value)}
                style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
              >
                <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextInactive]}>
                  {item.label}
                  {item.count > 0 ? ` (${item.count})` : ""}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Orders */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => setSelectedOrder(item)}>
            <Image source={resolveImageSource(item.restaurantImage)} style={styles.thumb} />
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <Text style={styles.storeName} numberOfLines={1}>
                  {item.restaurantName}
                </Text>

                <View
                  style={[
                    styles.badge,
                    { backgroundColor: STATUS_BADGE[item.status].bg },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: STATUS_BADGE[item.status].fg }]}>
                    {STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>

              <Text style={styles.items} numberOfLines={1}>
                {item.items.join(" · ")}
              </Text>

              <View style={styles.metaRow}>
                <Text style={styles.meta}>{item.orderDate}</Text>
                <Text style={styles.metaStrong}>{item.totalPrice.toLocaleString()}원</Text>
              </View>

              {item.deliveryTime ? (
                <Text style={styles.deliveryTime}>도착/예상: {item.deliveryTime}</Text>
              ) : null}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>주문 내역이 없습니다</Text>
            <Text style={styles.emptySub}>필터 조건에 해당하는 주문이 없어요.</Text>
          </View>
        }
      />

      {/* Detail modal */}
      <Modal
        visible={!!selectedOrder}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSelectedOrder(null)} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>주문 상세</Text>
            <Pressable onPress={() => setSelectedOrder(null)} hitSlop={10}>
              <Text style={styles.modalClose}>닫기</Text>
            </Pressable>
          </View>

          {selectedOrder ? (
            <View style={styles.modalBody}>
              <Image source={resolveImageSource(selectedOrder.restaurantImage)} style={styles.modalImage} />
              <Text style={styles.modalStore}>{selectedOrder.restaurantName}</Text>

              <View style={styles.modalLine} />

              <Text style={styles.modalLabel}>주문 메뉴</Text>
              {selectedOrder.items.map((it) => (
                <Text key={it} style={styles.modalItem}>
                  • {it}
                </Text>
              ))}

              <View style={styles.modalLine} />

              <Text style={styles.modalMeta}>
                주문일시: {selectedOrder.orderDate}
              </Text>
              <Text style={styles.modalMeta}>
                상태: {STATUS_LABEL[selectedOrder.status]}
              </Text>
              {selectedOrder.deliveryTime ? (
                <Text style={styles.modalMeta}>도착/예상: {selectedOrder.deliveryTime}</Text>
              ) : null}

              <Text style={styles.modalPrice}>
                합계 {selectedOrder.totalPrice.toLocaleString()}원
              </Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F7F9" },

  header: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  filterWrap: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  filterList: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  pillActive: { backgroundColor: ORANGE },
  pillInactive: { backgroundColor: "#F3F4F6" },
  pillText: { fontSize: 13, fontWeight: "600" },
  pillTextActive: { color: "white" },
  pillTextInactive: { color: "#374151" },

  list: { padding: 16, gap: 12 },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
  },
  thumb: { width: 88, height: 88 },
  cardBody: { flex: 1, padding: 12, gap: 6 },

  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  storeName: { flex: 1, fontSize: 15, fontWeight: "700", color: "#111827" },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: "700" },

  items: { fontSize: 13, color: "#6B7280" },

  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meta: { fontSize: 12, color: "#6B7280" },
  metaStrong: { fontSize: 13, fontWeight: "700", color: "#111827" },
  deliveryTime: { fontSize: 12, color: "#374151" },

  empty: { paddingVertical: 48, alignItems: "center" },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 6 },
  emptySub: { fontSize: 13, color: "#6B7280" },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  modalCard: {
    position: "absolute",
    left: 16,
    right: 16,
    top: "18%",
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalHeaderRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  modalClose: { fontSize: 13, fontWeight: "700", color: "#2563EB" },

  modalBody: { padding: 14 },
  modalImage: { width: "100%", height: 160, borderRadius: 12, marginBottom: 12 },
  modalStore: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 6 },

  modalLine: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 10 },

  modalLabel: { fontSize: 13, fontWeight: "800", color: "#111827", marginBottom: 6 },
  modalItem: { fontSize: 13, color: "#374151", marginBottom: 4 },

  modalMeta: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  modalPrice: { marginTop: 10, fontSize: 16, fontWeight: "900", color: "#111827" },
});
