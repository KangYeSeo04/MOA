import React, { useMemo, useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCartStore } from "@/stores/cart"; // ✅ alias 안되면 아래 "대체 import" 참고

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
  const [cartCount, setCartCount] = useState(0);
  const [query, setQuery] = useState("");

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

  const goBackToMap = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const addToCart = (item: MenuItem) => {
    const nextTotal = total + item.price;

    // ✅ 담은 금액 누적
    addPrice(restaurantId, item.price);
    setCartCount((c) => c + 1);

    // ✅ 2만원 이상 순간: 주문 접수 + 0원 초기화 + 지도 복귀
    if (nextTotal >= MIN_ORDER) {
      Alert.alert(
        "주문 접수 완료",
        `총 ${nextTotal.toLocaleString()}원 담겨서 주문이 접수되었어요!\n(담은 금액은 0원으로 초기화됩니다)`,
        [
          {
            text: "확인",
            onPress: () => {
              resetTotal(restaurantId); // ✅ 0원으로 초기화
              goBackToMap();            // ✅ 지도 복귀 (회색으로 돌아옴)
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBackToMap} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </Pressable>

        <View style={{ flex: 1, marginLeft: 8 }}>
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

      {/* Category pills */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pills}
        renderItem={({ item }) => {
          const active = selectedCategory === item.id;
          return (
            <Pressable
              onPress={() => setSelectedCategory(item.id)}
              style={[
                styles.pill,
                active ? styles.pillActive : styles.pillInactive,
              ]}
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

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.thumb} />
            <View style={{ flex: 1, padding: 12, gap: 6 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc} numberOfLines={2}>
                {item.description}
              </Text>
              <View style={styles.row}>
                <Text style={styles.price}>
                  {item.price.toLocaleString()}원
                </Text>
                <Pressable onPress={() => addToCart(item)} style={styles.addBtn}>
                  <Text style={styles.addBtnText}>담기</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: "center" }}>
            <Text style={{ color: "#6B7280" }}>해당 조건의 메뉴가 없어요</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F7F9" },

  header: {
    backgroundColor: "#F97316",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: { color: "white", fontSize: 18, fontWeight: "800" },
  subtitle: { color: "#FFEDD5", fontSize: 12, marginTop: 2 },

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
    margin: 16,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#111827" },

  pills: { paddingHorizontal: 12, gap: 8, paddingBottom: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  pillActive: { backgroundColor: "#F97316" },
  pillInactive: { backgroundColor: "#F3F4F6" },
  pillText: { fontSize: 13, fontWeight: "700" },
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
  itemName: { fontSize: 15, fontWeight: "800", color: "#111827" },
  itemDesc: { fontSize: 12, color: "#6B7280" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price: { fontSize: 13, fontWeight: "800", color: "#111827" },
  addBtn: {
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: "white", fontSize: 12, fontWeight: "800" },
});