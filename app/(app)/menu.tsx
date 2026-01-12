// app/(app)/menu.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useCartStore } from "../../stores/cart";
import { API_BASE } from "../../constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Category = "all" | "burger" | "side" | "drink";

type ApiMenu = {
  id: number;
  restaurantId: number;
  name: string;
  price: number;
  amountOrdered: number;
};

type RestaurantState = {
  id: number;
  pendingPrice: number;
  minOrderPrice: number;
};

type MenuItem = {
  id: string; // menuId (string)
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

// polling interval (ms)
const POLL_MS = 1200;

export default function BurgerMenuScreen() {
  const { rid, name, minOrder } = useLocalSearchParams<{
    rid?: string;
    name?: string;
    minOrder?: string;
  }>();

  const restaurantId = Number(rid ?? "1");

  // ✅ 로그인 유저 key (유저별 로컬 수량 표시용)
  const [userKey, setUserKey] = useState<string>("guest");
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("auth_user_key");
      if (saved && saved.trim()) setUserKey(saved.trim());
    })().catch(() => {});
  }, []);

  // --- store: 공동 금액(서버 pendingPrice)
  const total = useCartStore((s) => s.totals[restaurantId] ?? 0);
  const setTotal = useCartStore((s) => s.setTotal);

  // --- store: 유저별 로컬 수량(내 화면 stepper 표시용)
  const quantities = useCartStore(
    (s) => s.itemCountsByUser?.[userKey]?.[restaurantId] ?? EMPTY_COUNTS
  );
  const incItem = useCartStore((s) => s.increaseItem);
  const decItem = useCartStore((s) => s.decreaseItem);

  // ✅ 주문 접수/서버 리셋 감지 시: 모든 유저의 로컬 qty 잔상 제거
  const resetRestaurantItemsForAllUsers = useCartStore(
    (s) => s.resetRestaurantItemsForAllUsers
  );

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
  const orderingLockedRef = useRef(false);
  useEffect(() => {
    orderingLockedRef.current = orderingLocked;
  }, [orderingLocked]);

  // “내가 + 눌러서 임계치 넘겼을 때만” 알럿 뜨게 하기 위한 플래그
  const selfTriggeredRef = useRef(false);

  const categories = useMemo(
    () => [
      { id: "all" as const, name: "전체" },
      { id: "burger" as const, name: "버거" },
      { id: "side" as const, name: "사이드" },
      { id: "drink" as const, name: "음료" },
    ],
    []
  );

  // ✅ params 반영
  useEffect(() => {
    setRestaurantName(name ?? FALLBACK_RESTAURANT_NAME);

    const parsed = Number(minOrder ?? FALLBACK_MIN_ORDER);
    setMinOrderAmount(
      Number.isFinite(parsed) && parsed > 0 ? parsed : FALLBACK_MIN_ORDER
    );
  }, [name, minOrder, restaurantId]);

  // ✅ 메뉴 목록 가져오기 (메뉴명/가격)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const url = `${API_BASE}/restaurants/${restaurantId}/menus`;
      console.log("FETCH MENU =", url);

      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          `GET /restaurants/${restaurantId}/menus failed: ${res.status} ${text}`
        );
      }

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

  // ✅ 공동 pendingPrice polling → totals 동기화(다른 기기 반영)
  useEffect(() => {
    let dead = false;
    let timer: any = null;

    const tick = async () => {
      try {
        const url = `${API_BASE}/restaurants/${restaurantId}/state`;
        const res = await fetch(url);
        if (!res.ok) return;

        const st = (await res.json()) as RestaurantState;
        if (dead) return;

        if (typeof st?.pendingPrice === "number") {
          setTotal(restaurantId, st.pendingPrice);
        }

        if (typeof st?.minOrderPrice === "number" && st.minOrderPrice > 0) {
          setMinOrderAmount(st.minOrderPrice);
        }

        // ✅ 누가 주문완료를 했든 서버가 0으로 리셋되면 잔상 제거
        if (st?.pendingPrice === 0) {
          resetRestaurantItemsForAllUsers(restaurantId);
          setOrderingLocked(false);
          orderingLockedRef.current = false;
          selfTriggeredRef.current = false;
        }
      } catch {
        // 네트워크 에러는 조용히 재시도
      } finally {
        if (!dead) timer = setTimeout(tick, POLL_MS);
      }
    };

    tick();

    return () => {
      dead = true;
      if (timer) clearTimeout(timer);
    };
  }, [restaurantId, setTotal, resetRestaurantItemsForAllUsers]);

  const filtered = useMemo(() => {
    const byCategory =
      selectedCategory === "all"
        ? menuItems
        : menuItems.filter((m) => m.category === selectedCategory);

    const q = query.trim().toLowerCase();
    if (!q) return byCategory;

    return byCategory.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)
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

  // ----------------------------
  // ✅ 서버 업데이트 함수들
  // ----------------------------

  const patchPendingPrice = async (delta: number) => {
    const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/pendingPrice`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`pendingPrice update failed: ${res.status} ${text}`);
    }

    const st = (await res.json().catch(() => null)) as RestaurantState | null;
    if (st && typeof st.pendingPrice === "number") {
      setTotal(restaurantId, st.pendingPrice);
    }
    if (st && typeof st.minOrderPrice === "number" && st.minOrderPrice > 0) {
      setMinOrderAmount(st.minOrderPrice);
    }
    return st;
  };

  // ✅ DB의 Menu.amountOrdered(공동 수량)도 같이 업데이트해야 “DB 수량이 안 바뀜” 해결됨
  const patchMenuAmountOrdered = async (menuIdStr: string, delta: number) => {
    const menuId = Number(menuIdStr);
    if (!Number.isFinite(menuId)) throw new Error("Invalid menuId");

    const res = await fetch(
      `${API_BASE}/restaurants/${restaurantId}/menus/${menuId}/amountOrdered`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`amountOrdered update failed: ${res.status} ${text}`);
    }
  };

  const completeOrderOnServer = async () => {
    const res = await fetch(`${API_BASE}/restaurants/${restaurantId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`complete failed: ${res.status} ${text}`);
    }

    const st = (await res.json().catch(() => null)) as RestaurantState | null;
    if (st && typeof st.pendingPrice === "number") {
      setTotal(restaurantId, st.pendingPrice);
    }
    return st;
  };

  // ✅ 주문완료 알럿은 “내가 + 눌러서 임계치 넘긴 경우”만
  const completeOrderIfNeeded = (nextTotal: number) => {
    if (orderingLockedRef.current) return;
    if (!selfTriggeredRef.current) return; // ✅ 핵심
    if (nextTotal < minOrderAmount) return;

    orderingLockedRef.current = true;
    setOrderingLocked(true);

    Alert.alert(
      "주문 접수 완료",
      `총 ${nextTotal.toLocaleString()}원 담겨서 주문이 접수되었어요!\n(공동 장바구니가 초기화됩니다)`,
      [
        {
          text: "확인",
          onPress: async () => {
            try {
              await completeOrderOnServer();
            } catch (e: any) {
              Alert.alert("오류", e?.message ?? "주문 접수 처리 실패");
            } finally {
              // ✅ 로컬 잔상 제거
              resetRestaurantItemsForAllUsers(restaurantId);
              setOrderingLocked(false);
              orderingLockedRef.current = false;
              selfTriggeredRef.current = false;
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // ----------------------------
  // ✅ 버튼 핸들러
  // ----------------------------

  const increase = async (item: MenuItem) => {
    // ✅ “내가 눌렀다” 표시
    selfTriggeredRef.current = true;

    // 1) 내 로컬 qty 즉시 반영(화면용)
    incItem(userKey, restaurantId, item.id);

    try {
      // 2) 서버 공동 금액 업데이트
      const st = await patchPendingPrice(+item.price);

      // 3) 서버 공동 메뉴 수량 업데이트(DB)
      await patchMenuAmountOrdered(item.id, +1);

      const nextTotal = Number(st?.pendingPrice ?? total + item.price);
      completeOrderIfNeeded(nextTotal);
    } catch (e: any) {
      // 실패 시 로컬 롤백
      decItem(userKey, restaurantId, item.id);
      Alert.alert("오류", e?.message ?? "담기 실패(네트워크/서버)");
    }
  };

  const decrease = async (item: MenuItem) => {
    const qty = quantities[item.id] ?? 0;
    if (qty <= 0) return;

    // 1) 내 로컬 qty 즉시 반영
    decItem(userKey, restaurantId, item.id);

    try {
      // 2) 서버 공동 금액 업데이트
      await patchPendingPrice(-item.price);

      // 3) 서버 공동 메뉴 수량 업데이트(DB)
      await patchMenuAmountOrdered(item.id, -1);
    } catch (e: any) {
      // 실패 시 로컬 롤백
      incItem(userKey, restaurantId, item.id);
      Alert.alert("오류", e?.message ?? "빼기 실패(네트워크/서버)");
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

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
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