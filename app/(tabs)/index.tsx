import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, BackHandler, ToastAndroid, Platform } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Map, Restaurant } from "../../components/Map";
import { API_BASE } from "../../constants/api";
import { SearchBar } from "../../components/SearchBar";

type ApiRestaurant = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  minOrderPrice: number;
  pendingPrice: number;
};

export default function HomeScreen() {
  // ✅ 첫 진입 중심(모수)
  const center: [number, number] = [37.5412, 126.9962];

  // ✅ menu에서 돌아올 때 받을 파라미터
  // 예: router.push({ pathname: "/(tabs)", params: { focusRid: String(restaurantId) } })
  const { focusRid } = useLocalSearchParams<{ focusRid?: string }>();

  // focusRid -> number 변환
  const focusRestaurantId = useMemo(() => {
    const n = Number(focusRid);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [focusRid]);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  // ✅ 안드로이드 뒤로가기: 로그인으로 돌아가지 않게 처리
  useEffect(() => {
    if (Platform.OS !== "android") return;

    let lastBackPressed = 0;

    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      const now = Date.now();

      if (now - lastBackPressed < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressed = now;
      ToastAndroid.show("한 번 더 누르면 종료됩니다", ToastAndroid.SHORT);
      return true;
    });

    return () => sub.remove();
  }, []);

  const fetchRestaurants = useCallback(async () => {
    const url = `${API_BASE}/restaurants`;

    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`GET /restaurants failed: ${res.status} ${text}`);
    }

    const data: ApiRestaurant[] = await res.json();

    const mapped: Restaurant[] = data.map((r) => ({
      id: r.id,
      name: r.name,
      lat: r.latitude,
      lng: r.longitude,
      minOrderAmount: r.minOrderPrice,
      hasGroupUsers: false, // 백엔드에 없으니 임시
    }));

    setRestaurants(mapped);
  }, []);

  // ✅ 최초 1회 로드
  useEffect(() => {
    fetchRestaurants().catch((e) => console.error("GET /restaurants ERROR =", e));
  }, [fetchRestaurants]);

  // ✅ (핵심) 지도 화면에 있을 때만 주기적으로 갱신
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      let timer: any = null;

      fetchRestaurants().catch((e) => console.error("FOCUS fetchRestaurants ERROR =", e));

      timer = setInterval(() => {
        if (cancelled) return;
        fetchRestaurants().catch((e) => console.error("POLL fetchRestaurants ERROR =", e));
      }, 2000);

      return () => {
        cancelled = true;
        if (timer) clearInterval(timer);
      };
    }, [fetchRestaurants])
  );

  return (
    <View style={styles.container}>
      <Map
        restaurants={restaurants}
        center={center}
        focusRestaurantId={focusRestaurantId} // ✅ 추가: 이게 포인트
        onRestaurantPress={(rid) => {
          const r = restaurants.find((x) => x.id === rid);

          router.push({
            pathname: "/menu",
            params: {
              rid: String(rid),
              name: r?.name ?? "메뉴",
              minOrder: String(r?.minOrderAmount ?? 0),
            },
          });
        }}
      />

      <View style={styles.searchBarWrapper}>
        <SearchBar
          onPressSearch={() => {
            router.push("/search");
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  searchBarWrapper: {
    position: "absolute",
    top: 52,
    left: 15,
    right: 15,
    zIndex: 10,
  },
});