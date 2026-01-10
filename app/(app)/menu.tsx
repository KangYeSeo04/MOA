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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCartStore } from "@/stores/cart";

type Category = "all" | "burger" | "side" | "drink";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Category;
  isPopular?: boolean;
  isNew?: boolean;
};

const MIN_ORDER = 20000;

export default function BurgerMenuScreen() {
  const { rid } = useLocalSearchParams<{ rid?: string }>();
  const restaurantId = Number(rid ?? "1");

  const addPrice = useCartStore((s) => s.addPrice);
  const resetTotal = useCartStore((s) => s.resetTotal);
  const total = useCartStore((s) => s.totals[restaurantId] ?? 0);

  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const categories = [
    { id: "all" as const, name: "전체" },
    { id: "burger" as const, name: "버거" },
    { id: "side" as const, name: "사이드" },
    { id: "drink" as const, name: "음료" },
  ];

  const menuItems: MenuItem[] = [
    {
      id: "1",
      name: "시그니처 비프 버거",
      description: "100% 순수 소고기 패티와 신선한 야채, 특제 소스",
      price: 7900,
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      category: "burger",
      isPopular: true,
    },
    {
      id: "7",
      name: "프렌치 프라이 (R)",
      description: "바삭하게 튀긴 감자튀김",
      price: 2500,
      image:
        "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      category: "side",
    },
    {
      id: "11",
      name: "바닐라 쉐이크",
      description: "부드럽고 달콤한 바닐라 밀크쉐이크",
      price: 4200,
      image:
        "https://images.unsplash.com/photo-1696487774083-44992ca48eb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      category: "drink",
      isPopular: true,
    },
  ];

  const filtered = useMemo(() => {
    const byCategory =
      selectedCategory === "all"
        ? menuItems
        : menuItems.filter((m) => m.category === selectedCategory);

    const q = query.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  }, [selectedCategory, query]);

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

  const completeOrderIfNeeded = (nextTotal: number) => {
    if (nextTotal < MIN_ORDER) return;

    Alert.alert(
      "주문 접수 완료",
      `총 ${nextTotal.toLocaleString()}원 담겨서 주문이 접수되었어요!\n(담은 금액은 0원으로 초기화됩니다)`,
      [
        {
          text: "확인",
          onPress: () => {
            resetTotal(restaurantId);
            setQuantities({});
          },
        },
      ]
    );
  };

  const increase = (item: MenuItem) => {
    const nextTotal = total + item.price;

    addPrice(restaurantId, item.price);
    setQuantities((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] ?? 0) + 1,
    }));

    completeOrderIfNeeded(nextTotal);
  };

  const decrease = (item: MenuItem) => {
    const currentQty = quantities[item.id] ?? 0;
    if (currentQty <= 0) return;

    addPrice(restaurantId, -item.price);
    setQuantities((prev) => {
      const nextQty = (prev[item.id] ?? 0) - 1;
      if (nextQty <= 0) {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [item.id]: nextQty };
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBackToMap} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>버거하우스</Text>
          <Text style={styles.subtitle}>
            담은 금액: {total.toLocaleString()}원 / {MIN_ORDER.toLocaleString()}원
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

      {/* Category pills (더 컴팩트하게) */}
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

      {/* List */}
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
                  {item.description}
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
    </SafeAreaView>
  );
}

const ORANGE = "#F97316";

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F7F9" },

  // ✅ 헤더가 "너무 위"로 붙어 보이는 느낌 완화
  header: {
    backgroundColor: ORANGE,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: Platform.OS === "android" ? 18 : 10, // ✅ 살짝 아래로
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

  // ✅ 카테고리 영역을 따로 감싸서 "세로로 길쭉" 느낌 제거
  categoryWrap: {
    paddingBottom: 8,
  },
  categoryList: { maxHeight: 48 },
  categoryListContent: {
    paddingHorizontal: 16,
    gap: 8,
  },

  // ✅ pill을 컴팩트하게 (높이 고정)
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