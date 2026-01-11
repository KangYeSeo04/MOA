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
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useCartStore } from "@/stores/cart";
import { API_BASE } from "../../constants/api";

type Category = "all" | "burger" | "side" | "drink";

type ApiMenu = {
  id: number;
  restaurantId: number;
  name: string;
  price: number;
  amountOrdered: number;
};

type ApiRestaurant = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  minOrderPrice: number;
  pendingPrice: number;
};

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

const EMPTY_COUNTS: Record<string, number> = Object.freeze({});

export default function BurgerMenuScreen() {
  const { rid, name, minOrder } = useLocalSearchParams<{
    rid?: string;
    name?: string;
    minOrder?: string;
  }>();

  const restaurantId = Number(rid ?? "1");

  // ✅ “내 화면에만 보이는 내 수량” (DB와 분리)
  const quantities = useCartStore((s) => s.itemCounts[restaurantId] ?? EMPTY_COUNTS);
  const incItem = useCartStore((s) => s.increaseItem);
  const decItem = useCartStore((s) => s.decreaseItem);
  const resetItems = useCartStore((s) => s.resetItems);

  // 로컬 totals는 더 이상 “공동 누적금액”으로 쓰지 않음(혼동 방지)
  const resetTotal = useCartStore((s) => s.resetTotal);

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

  // ✅ 서버 공동 누적금액(= pendingPrice)
  const [serverPendingPrice, setServerPendingPrice] = useState<number>(0);

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

  // ✅ (핵심) 서버 pendingPrice 폴링: A가 담으면 B도 즉시 보임
  const fetchRestaurantPending = useCallback(async () => {
    const res = await fetch(`${API_BASE}/restaurants/${restaurantId}`);
    if (!res.ok) return;

    const r: ApiRestaurant = await res.json();
    setServerPendingPrice(r.pendingPrice ?? 0);

    // minOrder/name도 서버 기준으로 맞추고 싶으면 여기서 세팅 가능
    // setRestaurantName(r.name);
    // setMinOrderAmount(r.minOrderPrice);
  }, [restaurantId]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      let timer: any = null;

      fetchRestaurantPending().catch(() => {});

      timer = setInterval(() => {
        if (cancelled) return;
        fetchRestaurantPending().catch(() => {});
      }, 2000);

      return () => {
        cancelled = true;
        if (timer) clearInterval(timer);
      };
    }, [fetchRestaurantPending])
  );

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

  /**
   * ✅ DB 반영: 메뉴 수량 +/- → 서버에 PATCH 날리고,
   * 응답으로 온 restaurant.pendingPrice를 화면에 반영
   */
  const patchMenuDelta = useCallback(
    async (menuId: string, delta: 1 | -1) => {
      const url = `${API_BASE}/restaurants/${restaurantId}/menus/${Number(menuId)}/amount`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`PATCH failed ${res.status} ${text}`);
      }

      const json = await res.json();
      // json.restaurant.pendingPrice 를 신뢰
      if (json?.restaurant?.pendingPrice != null) {
        setServerPendingPrice(json.restaurant.pendingPrice);
      }
      return json;
    },
    [restaurantId]
  );

  /**
   * ✅ 주문 접수(초기화) = DB에 checkout 호출
   */
  const checkout = useCallback(async () => {
    const url = `${API_BASE}/restaurants/${restaurantId}/checkout`;
    const res = await fetch(url, { method: "POST" });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`checkout failed ${res.status} ${text}`);
    }

    const json = await res.json();
    setServerPendingPrice(0);

    // 내 로컬 “표시용 수량”도 초기화 (UX)
    resetItems(restaurantId);
    resetTotal(restaurantId);

    return json;
  }, [restaurantId, resetItems, resetTotal]);

  const completeOrderIfNeeded = useCallback(
    (nextPending: number) => {
      if (orderingLocked) return;
      if (nextPending < minOrderAmount) return;

      setOrderingLocked(true);

      Alert.alert(
        "주문 접수 완료",
        `총 ${nextPending.toLocaleString()}원 채워져서 주문이 접수되었어요!\n(공동 장바구니는 0원으로 초기화됩니다)`,
        [
          {
            text: "확인",
            onPress: async () => {
              try {
                await checkout();
              } catch (e: any) {
                Alert.alert("초기화 실패", e?.message ?? "checkout 실패");
              } finally {
                setOrderingLocked(false);
              }
            },
          },
        ],
        { cancelable: false }
      );
    },
    [orderingLocked, minOrderAmount, checkout]
  );

  const increase = async (item: MenuItem) => {
    // 1) 내 로컬 수량 UI는 즉시 증가(낙관적)
    incItem(restaurantId, item.id);

    try {
      // 2) DB 업데이트
      const json = await patchMenuDelta(item.id, 1);

      // 3) 응답으로 받은 pendingPrice 기준으로 주문 접수 판단
      const nextPending = json?.restaurant?.pendingPrice ?? serverPendingPrice;
      completeOrderIfNeeded(nextPending);
    } catch (e: any) {
      // 실패하면 롤백
      decItem(restaurantId, item.id);
      Alert.alert("오류", e?.message ?? "메뉴 추가 실패");
    }
  };

  const decrease = async (item: MenuItem) => {
    const qty = quantities[item.id] ?? 0;
    if (qty <= 0) return;

    // 1) 로컬 UI 먼저 감소
    decItem(restaurantId, item.id);

    try {
      // 2) DB 업데이트
      await patchMenuDelta(item.id, -1);
    } catch (e: any) {
      // 실패하면 롤백
      incItem(restaurantId, item.id);
      Alert.alert("오류", e?.message ?? "메뉴 감소 실패");
    }
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

          {/* ✅ “공동 누적 금액”을 서버 pendingPrice로 표시 */}
          <Text style={styles.subtitle}>
            누적 금액: {serverPendingPrice.toLocaleString()}원 / {minOrderAmount.toLocaleString()}원
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