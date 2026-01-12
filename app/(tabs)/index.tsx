import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, BackHandler, ToastAndroid, Platform, TouchableOpacity, Text } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Map, Restaurant } from "../../components/Map";
import type { MapHandle } from "../../components/Map";
import { API_BASE } from "../../constants/api";
import { SearchBar } from "../../components/SearchBar";
import * as Location from "expo-location";

type ApiRestaurant = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  minOrderPrice: number;
  pendingPrice: number;
};

export default function HomeScreen() {
  const mapRef = useRef<MapHandle>(null);

  // ✅ fallback(권한 거부/실패 시)
  const fallbackCenter: [number, number] = [37.5412, 126.9962];
  const [center, setCenter] = useState<[number, number]>(fallbackCenter);

  // 위치 권한/추적 상태
  const [hasLocation, setHasLocation] = useState(false);
  const [tracking, setTracking] = useState(false);

  // watchPosition 구독 보관
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  // ✅ menu에서 돌아올 때 받을 파라미터
  const { focusRid } = useLocalSearchParams<{ focusRid?: string }>();

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

  // ✅ 최초 권한 요청 + 현재 위치 1회 반영 (추적 아님)
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setHasLocation(false);
          return;
        }

        setHasLocation(true);

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;

        setCenter([lat, lng]);
        mapRef.current?.moveTo(lat, lng);
      } catch (e) {
        console.error("Location error:", e);
        setHasLocation(false);
      }
    })();
  }, []);

  // ✅ 추적 시작
  const startTracking = useCallback(async () => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }
      if (status !== "granted") {
        setHasLocation(false);
        return;
      }

      setHasLocation(true);

      // 이미 추적 중이면 먼저 해제
      locationSubRef.current?.remove();
      locationSubRef.current = null;

      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1500,
          distanceInterval: 3,
        },
        (loc) => {
          const lat = loc.coords.latitude;
          const lng = loc.coords.longitude;

          setCenter([lat, lng]);
          mapRef.current?.moveTo(lat, lng);
        }
      );

      setTracking(true);
    } catch (e) {
      console.error("startTracking error:", e);
    }
  }, []);

  // ✅ 추적 중지
  const stopTracking = useCallback(() => {
    locationSubRef.current?.remove();
    locationSubRef.current = null;
    setTracking(false);
  }, []);

  // ✅ 버튼: 추적 ON/OFF 토글
  const onPressMyLocation = useCallback(async () => {
    if (tracking) stopTracking();
    else await startTracking();
  }, [tracking, startTracking, stopTracking]);

  // ✅ 화면을 떠날 때 watchPosition 정리
  useEffect(() => {
    return () => {
      locationSubRef.current?.remove();
      locationSubRef.current = null;
    };
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
      hasGroupUsers: false,
    }));

    setRestaurants(mapped);
  }, []);

  useEffect(() => {
    fetchRestaurants().catch((e) => console.error("GET /restaurants ERROR =", e));
  }, [fetchRestaurants]);

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
        ref={mapRef}
        restaurants={restaurants}
        center={center}
        focusRestaurantId={focusRestaurantId}
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
        <SearchBar onPressSearch={() => router.push("/search")} />
      </View>

      {/* 📍/🧭 추적 토글 버튼 */}
      <TouchableOpacity
        style={[styles.myLocationButton, tracking ? styles.myLocationButtonActive : null]}
        onPress={onPressMyLocation}
        activeOpacity={0.85}
      >
        <Text style={styles.myLocationIcon}>{tracking ? "🧭" : "📍"}</Text>
      </TouchableOpacity>

      {!hasLocation && (
        <View style={styles.locationBanner}>
          <Text style={styles.locationBannerText}>
            위치 권한이 필요해요. 설정에서 위치 권한을 허용해 주세요.
          </Text>
        </View>
      )}
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

  myLocationButton: {
    position: "absolute",
    right: 16,
    bottom: 100,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  myLocationButtonActive: {
    backgroundColor: "#E8F0FE",
  },
  myLocationIcon: {
    fontSize: 20,
  },

  locationBanner: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 160,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  locationBannerText: {
    color: "white",
    fontSize: 13,
  },
});