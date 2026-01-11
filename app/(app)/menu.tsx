import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Pressable,
  FlatList,
  Image,
  Alert,
  BackHandler,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCartStore } from "@/stores/cart";
import { API_BASE } from "../../constants/api";

type Category = "all" | "burger" | "side" | "drink";

// 백엔드에서 오는 Menu 형태
type ApiMenu = {
  id: number;
  restaurantId: number;
  name: string;
  price: number;
  amountOrdered: number;
};

// 프론트에서 쓰는 MenuItem 형태(기존 UI 유지용)
type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Category;
};

const FALLBACK_RESTAURANT_NAME = "메뉴";
const FALLBACK_MIN_ORDER = 20000;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

// ✅ selector에서 쓰는 "안정적인" 빈 객체 (레퍼런스 고정)
const EMPTY_COUNTS: Record<string, number> = Object.freeze({});

export default function BurgerMenuScreen() {
  const { rid, name, minOrder } = useLocalSearchParams<{
    rid?: string;
    name?: string;
    minOrder?: string;
  }>();

  const restaurantId = Number(rid ?? "1");

  // --- store (가격/수량)
  const addPrice = useCartStore((s) => s.addPrice);
  const resetTotal = useCartStore((s) => s.resetTotal);
  const total = useCartStore((s) => s.totals[restaurantId] ?? 0);

  // ✅ 핵심: selector에서 ?? {} 하지 말고, 고정 레퍼런스 EMPTY_COUNTS 사용
  const quantities = useCartStore((s) => s.itemCounts[restaurantId] ?? EMPTY_COUNTS);

  const incItem = useCartStore((s) => s.increaseItem);
  const decItem = useCartStore((s) => s.decreaseItem);
  const resetItems = useCartStore((s) => s.resetItems);

  // --- 화면 상태
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");

  const [restaurantName, setRestaurantName] = useState<string>(
    name ?? FALLBACK_RESTAURANT_NAME
  );
  const [minOrderAmount, setMinOrderAmount] = useState<number>(
    Number(minOrder ?? FALLBACK_MIN_ORDER)
  );

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 주문 완료 Alert 중복 방지
  const [orderingLocked, setOrderingLocked] = useState(false);

  const categories = useMemo(
    () => [
      { id: "all" as const, name: "전체" },
      { id: "burger" as const, name: "버거" },
      { id: "side" as const, name: "사이드" },
      { id: "drink" as const, name: "음료" },
    ],
    []
  );

  // ✅ params로 들어온 name/minOrder가 바뀌면 화면에도 반영
  useEffect(() => {
    setRestaurantName(name ?? FALLBACK_RESTAURANT_NAME);
    setMinOrderAmount(Number(minOrder ?? FALLBACK_MIN_ORDER));
  }, [name, minOrder, restaurantId]);

  // ✅ 메뉴 서버에서 가져오기
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const url = `${API_BASE}/restaurants/${restaurantId}/menus`;
      console.log("FETCH MENU =", url);

      const res = await fetch(url);
      if (!res.ok) throw new Error(`GET /restaurants/${restaurantId}/menus failed: ${res.status}`);

      const data: ApiMenu[] = await res.json();

      const mapped: MenuItem[] = data.map((m) => ({
        id: String(m.id),
        name: m.name,
        description: "",
        price: m.price,
        image: FALLBACK_IMAGE,
        category: "all",
      }));

      if (!cancelled) setMenuItems(mapped);
    })()
      .catch((e) => console.error("MENU FETCH ERROR =", e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  const filtered = useMemo(() => {
    const byCategory =
      selectedCategory === "all"
        ? menuItems
        : menuItems.filter((m) => m.category === selectedCategory);

    const q = query.trim().toLowerCase();
    if (!q) return byCategory;

    return byCategory.filter(
      (m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
    );
  }, [selectedCategory, query, menuItems]);

  const cartCount = useMemo(() => {
    // quantities가 EMPTY_COUNTS(고정)일 수도 있으니 안전
    return Object.values(quantities).reduce((acc, v) => acc + v, 0);
  }, [quantities]);

  const goBackToMap = useCallback(() => {
    router.replace("/(tabs)");
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      goBackToMap();
      return true;
    });

    return () => sub.remove();
  }, [goBackToMap]);

  const completeOrderIfNeeded = (nextTotal: number) => {
    if (orderingLocked) return;
    if (nextTotal < minOrderAmount) return;

    setOrderingLocked(true);

    Alert.alert(
      "주문 접수 완료",
      `총 ${nextTotal.toLocaleString()}원 담겨서 주문이 접수되었어요!\n(담은 금액은 0원으로 초기화됩니다)`,
      [
        {
          text: "확인",
          onPress: () => {
            resetTotal(restaurantId);
            resetItems(restaurantId);
            setOrderingLocked(false);
          },
        },
      ],
      { cancelable: false }
    );
  };

  const increase = (item: MenuItem) => {
    const nextTotal = total + item.price;
    addPrice(restaurantId, item.price);
    incItem(restaurantId, item.id);
    completeOrderIfNeeded(nextTotal);
  };

  const decrease = (item: MenuItem) => {
    const qty = quantities[item.id] ?? 0;
    if (qty <= 0) return;
    addPrice(restaurantId, -item.price);
    decItem(restaurantId, item.id);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBackToMap} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>{restaurantName}</Text>
          <Text style={styles.subtitle}>
            담은 금액: {total.toLocaleString()}원 / {minOrderAmount.toLocaleString()}원
          </Text>
        </View>

        <View style={styles.cartWrap}>
          <Ionicons name="cart-outline" size={22} color="white" />
          {cartCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="메뉴 검색..."
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
        <Ionicons name="options-outline" size={18} color="#9CA3AF" />
      </View>

      {/* Category pills */}
      <View style={styles.categoryWrap}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(c) => c.id}
          showsHorizontalScrollIndicator={false}
          style={styles.categoryList}
          contentContainerStyle={styles.categoryListContent}
          renderItem={({ item }) => {
            const active = selectedCategory === item.id;
            return (
              <Pressable
                onPress={() => setSelectedCategory(item.id)}
                style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
              >
                <Text
                  style={[
                    styles.pillText,
                    active ? styles.pillTextActive : styles.pillTextInactive,
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10, color: "#6B7280" }}>메뉴 불러오는 중...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const qty = quantities[item.id] ?? 0;

            return (
              <View style={styles.card}>
                <Image source={{ uri: item.image }} style={styles.thumb} />
                <View style={{ flex: 1, padding: 12, gap: 6 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDesc} numberOfLines={2}>
                    {item.description || "설명 없음"}
                  </Text>

                  <View style={styles.row}>
                    <Text style={styles.price}>{item.price.toLocaleString()}원</Text>

                    {qty === 0 ? (
                      <Pressable onPress={() => increase(item)} style={styles.addBtn}>
                        <Text style={styles.addBtnText}>담기</Text>
                      </Pressable>
                    ) : (
                      <View style={styles.stepper}>
                        <Pressable onPress={() => decrease(item)} style={styles.stepBtn} hitSlop={8}>
                          <Text style={styles.stepBtnText}>-</Text>
                        </Pressable>

                        <Text style={styles.qtyText}>{qty}</Text>

                        <Pressable onPress={() => increase(item)} style={styles.stepBtn} hitSlop={8}>
                          <Text style={styles.stepBtnText}>+</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ padding: 32, alignItems: "center" }}>
              <Text style={{ color: "#6B7280" }}>해당 조건의 메뉴가 없어요</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const ORANGE = "#F97316";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F7F9" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    backgroundColor: ORANGE,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: Platform.OS === "android" ? 18 : 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: { paddingVertical: 6, paddingRight: 4 },
  headerTitleWrap: { flex: 1 },
  title: { color: "white", fontSize: 20, fontWeight: "900" },
  subtitle: { color: "#FFEDD5", fontSize: 12, marginTop: 3 },

  cartWrap: { padding: 8 },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#EF4444",
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "white", fontSize: 11, fontWeight: "800" },

  searchRow: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },

  categoryWrap: { paddingBottom: 8 },
  categoryList: { maxHeight: 48 },
  categoryListContent: { paddingHorizontal: 16, gap: 8 },

  pill: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pillActive: { backgroundColor: ORANGE },
  pillInactive: { backgroundColor: "#F3F4F6" },
  pillText: { fontSize: 13, fontWeight: "800" },
  pillTextActive: { color: "white" },
  pillTextInactive: { color: "#374151" },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    flexDirection: "row",
  },
  thumb: { width: 96, height: 96 },
  itemName: { fontSize: 15, fontWeight: "900", color: "#111827" },
  itemDesc: { fontSize: 12, color: "#6B7280" },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  price: { fontSize: 13, fontWeight: "900", color: ORANGE },

  addBtn: {
    backgroundColor: "#f57c00",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    minWidth: 70,
    alignItems: "center",
  },
  addBtnText: { color: "white", fontSize: 12, fontWeight: "900" },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f57c00",
    borderRadius: 12,
    overflow: "hidden",
  },
  stepBtn: { paddingHorizontal: 12, paddingVertical: 9 },
  stepBtnText: { color: "white", fontSize: 14, fontWeight: "900" },
  qtyText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    minWidth: 22,
    textAlign: "center",
  },
});