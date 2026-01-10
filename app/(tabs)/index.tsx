import React, { useEffect, useState } from "react";
import { View, StyleSheet, BackHandler, ToastAndroid, Platform } from "react-native";
import { router } from "expo-router";
import { Map, Restaurant } from "../../components/Map";
import { API_BASE } from "../../constants/api";

type ApiRestaurant = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  minOrderPrice: number;
  pendingPrice: number;
};

export default function HomeScreen() {
  const center: [number, number] = [37.5412, 126.9962];

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

  // ✅ 서버에서 restaurants 가져오기
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const url = `${API_BASE}/restaurants`;
      console.log("FETCH URL =", url);

      const res = await fetch(url);
      console.log("FETCH STATUS =", res.status);

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

      if (!cancelled) setRestaurants(mapped);
    })().catch((e) => {
      console.error("GET /restaurants ERROR =", e);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Map
        restaurants={restaurants}
        center={center}
        onRestaurantPress={(rid) => {
          const r = restaurants.find((x) => x.id === rid);

          router.push({
            pathname: "/menu", // ✅ 그룹명 말고 이렇게 가는 게 안전
            params: {
              rid: String(rid),
              name: r?.name ?? "메뉴",
              minOrder: String(r?.minOrderAmount ?? 0),
            },
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});