// app/(app)/order_cart.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import { getToken } from "../lib/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  FlatList,
  Image,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { API_BASE } from "../../constants/api"; // ✅ menu.tsx랑 동일 경로
import { useCartStore } from "../../stores/cart";
import {
  formatOrderDate,
  resolveOrderUserKey,
  type OrderHistoryEntry,
} from "../lib/orderHistory";
import { getPaymentMethod } from "../lib/paymentMethod";
import { setPendingOrder } from "../lib/pendingOrder";

type ApiMenu = {
  id: number;
  restaurantId: number;
  name: string;
  price: number;
  amountOrdered: number; // ✅ DB 공동 수량
};

type RestaurantState = {
  id: number;
  pendingPrice: number;
  minOrderPrice: number;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image: ImageSourcePropType;
};

type MeResponse = {
  id: number;
  username: string;
  email: string;
  phone: string;
  nickname: string | null;
  address: string | null;
};

const ORANGE = "#f57c00";
const EMPTY_COUNTS: Record<string, number> = Object.freeze({});

const ADDRESS_CACHE_KEY = "profile_address_cache_v1";

// ✅ menu.tsx와 동일한 매핑 키: `${restaurantId}:${menuName}`
const MENU_IMAGES_BY_KEY: Record<string, any> = {
  // 모수
  "1:영길불에 태운 도토리 국수": require("../../assets/images/dotori.png"),
  "1:작은 한입들": require("../../assets/images/small.png"),
  "1:우엉 타르트": require("../../assets/images/ung.png"),

  // 페페스
  "2:봉골레": require("../../assets/images/bongole.png"),
  "2:까르보나라": require("../../assets/images/carbonara.png"),
  "2:라구": require("../../assets/images/lagu.png"),
  "2:앤쵸비 오일": require("../../assets/images/oil.png"),
  "2:카치오 에 페페": require("../../assets/images/pepe.png"),
};

const FALLBACK_LOCAL_IMAGE = require("../../assets/images/dotori.png");

export default function OrderCartScreen() {
  const { rid, name } = useLocalSearchParams<{ rid?: string; name?: string }>();
  const restaurantId = Number(rid ?? "1");
  const restaurantName = (name ?? "장바구니") as string;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CartItem[]>([]);
  const [pendingPrice, setPendingPrice] = useState<number>(0);
  const [minOrderPrice, setMinOrderPrice] = useState<number>(0);
  const [address, setAddress] = useState<string>("");
  const itemCountsByUser = useCartStore((s) => s.itemCountsByUser);


  // 폴링 정지 플래그
  const pollingDeadRef = useRef(false);

  // ----------------------------
  // 서버 API
  // ----------------------------
  const fetchMyAddress = useCallback(async () => {
    // 1) 캐시 먼저 표시
    try {
      const cached = await AsyncStorage.getItem(ADDRESS_CACHE_KEY);
      if (cached && cached.trim()) setAddress(cached.trim());
    } catch {}
  
    // 2) 서버에서 최신값(가능하면) 갱신
    try {
      const token = await getToken();
      if (!token) return;
  
      const res = await fetch(`${API_BASE}/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const json = await res.json().catch(() => null);
      if (!res.ok) return;
  
      const me = json as MeResponse;
      const addr = typeof me.address === "string" ? me.address.trim() : "";
  
      if (addr) {
        setAddress(addr);
        await AsyncStorage.setItem(ADDRESS_CACHE_KEY, addr);
      } else {
        setAddress("");
        await AsyncStorage.removeItem(ADDRESS_CACHE_KEY);
      }
    } catch {}
  }, [API_BASE]);

  useFocusEffect(
    useCallback(() => {
      fetchMyAddress();
    }, [fetchMyAddress])
  );

  // ----------------------------
  // 데이터 fetch
  // ----------------------------
  const fetchCart = useCallback(async () => {
    const url = `${API_BASE}/restaurants/${restaurantId}/menus`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GET menus failed: ${res.status} ${text}`);
    }

    const data: ApiMenu[] = await res.json();

    const cartItems: CartItem[] = data
      .filter((m) => (m.amountOrdered ?? 0) > 0)
      .map((m) => ({
        id: String(m.id),
        name: m.name,
        price: m.price,
        qty: m.amountOrdered,
        image:
          MENU_IMAGES_BY_KEY[`${restaurantId}:${m.name}`] ?? FALLBACK_LOCAL_IMAGE,
      }));

    setItems(cartItems);
  }, [restaurantId]);

  const fetchState = useCallback(async () => {
    const url = `${API_BASE}/restaurants/${restaurantId}/state`;
    const res = await fetch(url);
    if (!res.ok) return;

    const st = (await res.json()) as RestaurantState;
    if (typeof st?.pendingPrice === "number") setPendingPrice(st.pendingPrice);
    if (typeof st?.minOrderPrice === "number") setMinOrderPrice(st.minOrderPrice);
  }, [restaurantId]);

  // 최초 로드
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchCart(), fetchState(), fetchMyAddress()]);
      } catch (e: any) {
        Alert.alert("오류", e?.message ?? "장바구니 불러오기 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchCart, fetchState]);

  // 다른 기기 반영 폴링
  useEffect(() => {
    pollingDeadRef.current = false;
    let timer: any = null;

    const tick = async () => {
      try {
        await Promise.all([fetchState(), fetchCart()]);
      } catch {
        // 네트워크 순간 끊김 무시
      } finally {
        if (!pollingDeadRef.current) timer = setTimeout(tick, 1500);
      }
    };

    tick();

    return () => {
      pollingDeadRef.current = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetchCart, fetchState]);

  // ----------------------------
  // 수량 조절 (DB/금액 동기화)
  // ----------------------------
  

  // ----------------------------
  // 결제 요약 (지금은 배달팁/할인 0)
  // ----------------------------
  const deliveryTip = 0;
  const discount = 0;

  const finalPay = useMemo(() => {
    return Math.max(0, pendingPrice + deliveryTip - discount);
  }, [pendingPrice, deliveryTip, discount]);

  const canOrder = pendingPrice >= (minOrderPrice || 0) && pendingPrice > 0;

  const serializeImageSource = (
    image: ImageSourcePropType | undefined
  ): string | number | undefined => {
    if (!image) return undefined;
    if (typeof image === "number") return image;
    if (Array.isArray(image)) return undefined;
    if (typeof image === "object" && "uri" in image) {
      const uri = image.uri;
      return typeof uri === "string" && uri.trim() ? uri : undefined;
    }
    if (typeof image === "string" && image.trim()) return image;
    return undefined;
  };

  const buildOrderHistoryEntry = (userKey: string): OrderHistoryEntry | null => {
    const localCounts =
      itemCountsByUser?.[userKey]?.[restaurantId] ?? EMPTY_COUNTS;
    const localEntries = Object.entries(localCounts).filter(([, qty]) => qty > 0);
    if (localEntries.length === 0) return null;

    const byId = new Map(items.map((item) => [item.id, item]));
    const orderItems: string[] = [];
    let totalPrice = 0;
    let thumbnail: string | number | undefined;

    for (const [menuId, qty] of localEntries) {
      const item = byId.get(menuId);
      if (!item) continue;

      orderItems.push(qty > 1 ? `${item.name} x${qty}` : item.name);
      totalPrice += item.price * qty;

      if (!thumbnail) {
        thumbnail = serializeImageSource(item.image);
      }
    }

    if (orderItems.length === 0) return null;

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      restaurantName,
      restaurantImage: thumbnail,
      items: orderItems,
      totalPrice,
      orderDate: formatOrderDate(new Date()),
      status: "delivered",
    };
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color="#111827" />
          </Pressable>

          <Text style={styles.headerTitle}>장바구니</Text>

          <View style={{ width: 26 }} />
        </View>

        {/* Restaurant name row */}
        <View style={styles.restaurantRow}>
          <Text style={styles.restaurantName}>{restaurantName}</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 10, color: "#6B7280" }}>장바구니 불러오는 중...</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 120, // ✅ 하단 고정 주문바(고정 컨테이너) 가림 방지
              gap: 12,
            }}
            renderItem={({ item }) => (
                <View style={styles.itemCard}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
              
                    <Text style={styles.itemMeta}>
                      가격: {item.price.toLocaleString()}원 · 수량 {item.qty}개
                    </Text>
              
                    <Text style={styles.itemPrice}>
                      {(item.price * item.qty).toLocaleString()}원
                    </Text>
              
                    <Text style={styles.hint}>
                      수량 변경은 메뉴 화면에서 해주세요
                    </Text>
                  </View>
              
                  <Image source={item.image} style={styles.thumb} />
                </View>
              )}
            ListEmptyComponent={
              <View style={{ padding: 28, alignItems: "center" }}>
                <Text style={{ color: "#6B7280", fontWeight: "700" }}>담긴 메뉴가 없어요</Text>
                <Pressable onPress={() => router.back()} style={styles.addMoreBtn}>
                  <Text style={styles.addMoreBtnText}>메뉴 담으러 가기</Text>
                </Pressable>
              </View>
            }
            // ✅ 결제확인(payBox)만 스크롤 끝에서 보이게!
            ListFooterComponent={
              items.length === 0 ? null : (
                <View style={{ marginTop: 12, marginBottom: 12, gap: 12 }}>
                  {/* ✅ 주소 확인 */}
                  <View style={styles.addressBox}>
                    <View style={styles.addressHeader}>
                      <Text style={styles.addressTitle}>주소를 확인해주세요</Text>
            
                      <Pressable
                        onPress={() => {
                          // 원하는 방식으로 이동/수정 가능
                          // 예: 주소 수정 페이지로 이동
                          // router.push({ pathname: "/address_edit", params: { rid: String(restaurantId) } });
                          Alert.alert("주소 변경", "주소 변경 화면으로 이동하게 연결하면 됩니다!");
                        }}
                        hitSlop={10}
                        style={styles.addressEditBtn}
                      >
                        <Text style={styles.addressEditText}>변경</Text>
                      </Pressable>
                    </View>
            
                    <View style={styles.addressRow}>
                      <Ionicons name="location-outline" size={18} color="#111827" />
                      <Text style={styles.addressText} numberOfLines={2}>
                        {address
                          ? address
                          : "주소가 등록되어 있지 않아요. 마이페이지에서 주소를 등록해주세요."}
                      </Text>

                    </View>
            
                    <Text style={styles.addressHint}>
                      정확한 주소를 입력하면 배달이 더 빨라요.
                    </Text>
                  </View>
            
                  {/* ✅ 결제확인 */}
                  <View style={styles.payBox}>
                    <Text style={styles.payTitle}>결제금액을 확인해주세요</Text>
            
                    <View style={styles.payRow}>
                      <Text style={styles.payLabel}>메뉴 금액</Text>
                      <Text style={styles.payValue}>{pendingPrice.toLocaleString()}원</Text>
                    </View>
            
                    <View style={styles.payRow}>
                      <Text style={styles.payLabel}>배달팁</Text>
                      <Text style={styles.payValue}>{deliveryTip.toLocaleString()}원</Text>
                    </View>
            
                    <View style={styles.dash} />
            
                    <View style={styles.payRow}>
                      <Text style={styles.payLabelStrong}>총 할인받은 금액</Text>
                      <Text style={styles.payDiscount}>-{discount.toLocaleString()}원</Text>
                    </View>
            
                    <View style={styles.hr} />
            
                    <View style={styles.payRow}>
                      <Text style={styles.payFinalLabel}>결제예정금액</Text>
                      <Text style={styles.payFinalValue}>{finalPay.toLocaleString()}원</Text>
                    </View>
                  </View>
                </View>
              )
            }
            
          />
        )}

        {/* ✅ 주문하기 컨테이너는 하단 고정 */}
        <View style={styles.orderBarFixed} pointerEvents="box-none">
          <View style={styles.orderBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderPrice}>{finalPay.toLocaleString()}원</Text>
              <Text style={styles.orderSub}>
                {canOrder ? "주문 가능" : `최소주문 ${minOrderPrice.toLocaleString()}원`}
              </Text>
            </View>

            <Pressable
  disabled={!canOrder}
  onPress={() => {
    Alert.alert(
      "주문하시겠어요?",
      "주문을 완료하면 공동 장바구니가 초기화됩니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "주문하기",
          onPress: async () => {
            try {
              const method = await getPaymentMethod();
              if (!method) {
                Alert.alert(
                  "결제수단 필요",
                  "마이페이지에서 결제수단을 먼저 등록해주세요."
                );
                return;
              }

              const userKey = await resolveOrderUserKey();
              const orderEntry = buildOrderHistoryEntry(userKey);
              if (!orderEntry) {
                Alert.alert("오류", "주문할 메뉴가 없습니다.");
                return;
              }

              await setPendingOrder({
                userKey,
                restaurantId,
                restaurantName,
                minOrderPrice: minOrderPrice || 0,
                orderEntry,
                createdAt: Date.now(),
              });

              router.push("/payment");
            } catch (e: any) {
              Alert.alert("오류", e?.message ?? "주문 실패");
            }
          },
        },
      ]
    );
  }}
  style={[styles.orderBtn, !canOrder && styles.orderBtnDisabled]}
>
  <Text style={[styles.orderBtnText, !canOrder && styles.orderBtnTextDisabled]}>
    주문하기
  </Text>
</Pressable>

          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F6F7F9" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  hint: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
  },
  
  header: {
    backgroundColor: "white",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 10 : 10,
    paddingBottom: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  backBtn: { padding: 6 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },

  restaurantRow: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  restaurantName: { fontSize: 16, fontWeight: "900", color: "#111827" },

  itemCard: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  thumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: "#F3F4F6" },

  itemName: { fontSize: 15, fontWeight: "900", color: "#111827" },
  itemMeta: { fontSize: 12, color: "#6B7280", fontWeight: "700" },
  itemPrice: { fontSize: 18, fontWeight: "900", color: "#111827", marginTop: 2 },

  stepper: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  stepBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "white" },
  qtyText: {
    width: 36,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },

  addMoreBtn: {
    marginTop: 12,
    backgroundColor: ORANGE,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addMoreBtnText: { color: "white", fontWeight: "900" },

  // ✅ 결제확인 박스(스크롤로 내려가야 보임)
  payBox: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  payTitle: { fontSize: 16, fontWeight: "900", color: "#111827", marginBottom: 10 },

  payRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 7,
  },
  payLabel: { fontSize: 14, color: "#111827", fontWeight: "800" },
  payValue: { fontSize: 14, color: "#111827", fontWeight: "900" },

  dash: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginVertical: 10,
    borderStyle: "dashed",
  },
  hr: { borderTopWidth: 1, borderTopColor: "#111827", marginVertical: 10 },

  payLabelStrong: { fontSize: 14, color: "#f57c00", fontWeight: "900" },
  payDiscount: { fontSize: 14, color: "#f57c00", fontWeight: "900" },

  payFinalLabel: { fontSize: 16, color: "#111827", fontWeight: "900" },
  payFinalValue: { fontSize: 22, color: "#111827", fontWeight: "900" },

  // ✅ 하단 주문바(고정)
  orderBarFixed: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  orderBar: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  orderPrice: { fontSize: 20, fontWeight: "900", color: "#111827" },
  orderSub: { marginTop: 2, fontSize: 12, color: "#6B7280", fontWeight: "700" },

  orderBtn: {
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  orderBtnDisabled: { backgroundColor: "#E5E7EB" },
  orderBtnText: { color: "white", fontSize: 15, fontWeight: "900" },
  orderBtnTextDisabled: { color: "#9CA3AF" },

  addressBox: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  addressTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },
  
  addressEditBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
  },
  addressEditText: { fontSize: 13, fontWeight: "900", color: ORANGE },
  
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 20,
  },
  addressHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
  },
  
});