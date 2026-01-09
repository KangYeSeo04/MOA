// app/(tabs)/orders.tsx
import React, { useMemo, useState } from "react";
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

type OrderStatus = "delivered" | "delivering" | "preparing" | "cancelled";

type Order = {
  id: string;
  restaurantName: string;
  restaurantImage: string;
  items: string[];
  totalPrice: number;
  orderDate: string;
  status: OrderStatus;
  deliveryTime?: string;
};

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

const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    restaurantName: "교촌치킨 강남점",
    restaurantImage:
      "https://images.unsplash.com/photo-1687966699414-095ca9c35593?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    items: ["허니콤보", "치즈볼", "콜라 1.25L"],
    totalPrice: 28000,
    orderDate: "2026.01.09 19:45",
    status: "delivered",
    deliveryTime: "20:25",
  },
  {
    id: "2",
    restaurantName: "피자헛 신논현점",
    restaurantImage:
      "https://images.unsplash.com/photo-1672860886897-ed3abfdd3952?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    items: ["슈퍼슈프림 L", "치즈크러스트", "감자튀김"],
    totalPrice: 35500,
    orderDate: "2026.01.08 18:20",
    status: "delivered",
    deliveryTime: "19:10",
  },
  {
    id: "3",
    restaurantName: "짜장명가",
    restaurantImage:
      "https://images.unsplash.com/photo-1661532842825-4fe9dce30428?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    items: ["짜장면", "짬뽕", "탕수육(소)"],
    totalPrice: 25000,
    orderDate: "2026.01.07 12:30",
    status: "delivering",
    deliveryTime: "예상 13:00",
  },
  {
    id: "4",
    restaurantName: "오마카세 스시",
    restaurantImage:
      "https://images.unsplash.com/photo-1582450871972-ab5ca641643d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    items: ["연어초밥 세트", "모듬회", "우동"],
    totalPrice: 42000,
    orderDate: "2026.01.06 17:50",
    status: "delivered",
    deliveryTime: "18:35",
  },
  {
    id: "5",
    restaurantName: "맘스터치 역삼점",
    restaurantImage:
      "https://images.unsplash.com/photo-1687966699414-095ca9c35593?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    items: ["싸이버거 세트", "치킨너겟", "콜라"],
    totalPrice: 13500,
    orderDate: "2026.01.05 14:15",
    status: "preparing",
  },
  {
    id: "6",
    restaurantName: "피자알볼로",
    restaurantImage:
      "https://images.unsplash.com/photo-1672860886897-ed3abfdd3952?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    items: ["고르곤졸라 피자 M"],
    totalPrice: 18000,
    orderDate: "2026.01.04 20:00",
    status: "cancelled",
  },
];

export default function OrdersScreen() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  const counts = useMemo(() => {
    const c = {
      all: MOCK_ORDERS.length,
      delivered: MOCK_ORDERS.filter((o) => o.status === "delivered").length,
      delivering: MOCK_ORDERS.filter((o) => o.status === "delivering").length,
      preparing: MOCK_ORDERS.filter((o) => o.status === "preparing").length,
      cancelled: MOCK_ORDERS.filter((o) => o.status === "cancelled").length,
    };
    return c;
  }, []);

  const filteredOrders = useMemo(() => {
    if (filter === "all") return MOCK_ORDERS;
    return MOCK_ORDERS.filter((o) => o.status === filter);
  }, [filter]);

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
            <Image source={{ uri: item.restaurantImage }} style={styles.thumb} />
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
              <Image source={{ uri: selectedOrder.restaurantImage }} style={styles.modalImage} />
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
  pillActive: { backgroundColor: "#2563EB" },
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