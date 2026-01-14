import React, { useEffect, useState } from "react";
import { View, TextInput, FlatList, Pressable, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { API_BASE } from "../constants/api";
import { Ionicons } from "@expo/vector-icons";

type Restaurant = {
  id: number;
  name: string;
  minOrderPrice: number;
  pendingPrice: number;
};

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/restaurants?query=${encodeURIComponent(q)}`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [query]);

  return (
    
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </Pressable>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="식당 검색하기"
          placeholderTextColor="#6B7280"
          style={styles.input}
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          keyboardType="default"
          textContentType="none"
          inputMode="text"
        />
      </View>

      <FlatList
        data={items}
        keyExtractor={(r) => String(r.id)}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>{loading ? "검색 중..." : "검색 결과가 없어요"}</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => {
              // ✅ 여기서 메뉴 페이지로 이동!
              router.push({
                pathname: "/menu",
                params: {
                  rid: String(item.id),
                  name: item.name,
                  minOrder: String(item.minOrderPrice ?? 0),
                },
              });
            }}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              최소주문 {item.minOrderPrice}원 · 공동담기 {item.pendingPrice ?? 0}원
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    backgroundColor: "white",
  },

  /* ✅ 추가 */
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1, // ← 버튼 옆에서도 꽉 차게
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  name: { fontSize: 16, color: "#111827" },
  meta: { marginTop: 4, fontSize: 12, color: "#6B7280" },
  empty: { textAlign: "center", marginTop: 20, color: "#6B7280" },
});
