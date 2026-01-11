import React, { useMemo, useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker, Circle, Callout, Region } from "react-native-maps";

export interface Restaurant {
  id: number;
  name: string;
  lat: number;
  lng: number;

  minOrderAmount: number;
  pendingPrice: number; // ✅ DB 공동 장바구니 금액

  hasGroupUsers: boolean;
}

interface RestaurantMapProps {
  restaurants: Restaurant[];
  center: [number, number];
  onRestaurantPress?: (restaurantId: number) => void;
}

/**
 * ✅ 추천 줌 레벨
 * - 0.004 ~ 0.010 사이에서 취향 조절
 */
const DEFAULT_DELTA = 0.006;

export function Map({ restaurants, center, onRestaurantPress }: RestaurantMapProps) {
  const mapRef = useRef<MapView>(null);
  const didInitRef = useRef(false);

  const initialRegion: Region = useMemo(
    () => ({
      latitude: center[0],
      longitude: center[1],
      latitudeDelta: DEFAULT_DELTA,
      longitudeDelta: DEFAULT_DELTA,
    }),
    [center]
  );

  // ✅ 최초 1회만 center로 이동(뒤로 돌아올 때 확대/이동 튐 방지)
  useEffect(() => {
    if (!mapRef.current) return;
    if (didInitRef.current) return;
    didInitRef.current = true;

    mapRef.current.animateToRegion(
      {
        latitude: center[0],
        longitude: center[1],
        latitudeDelta: DEFAULT_DELTA,
        longitudeDelta: DEFAULT_DELTA,
      },
      250
    );
  }, [center]);

  /**
   * 🎨 마커 색상 (DB pendingPrice 기준)
   * - pendingPrice == 0 → 회색
   * - pendingPrice / minOrderAmount 비율에 따라 연한 빨강 → 진한 빨강
   */
  const getMarkerColor = (restaurant: Restaurant) => {
    const total = restaurant.pendingPrice ?? 0;
    if (total <= 0) return "#9CA3AF"; // 회색

    const min = Math.max(1, restaurant.minOrderAmount);
    const progress = Math.min(1, total / min); // 0~1

    const light = { r: 252, g: 165, b: 165 }; // 연한 빨강
    const dark = { r: 185, g: 28, b: 28 }; // 진한 빨강

    const r = Math.round(light.r + (dark.r - light.r) * progress);
    const g = Math.round(light.g + (dark.g - light.g) * progress);
    const b = Math.round(light.b + (dark.b - light.b) * progress);

    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={initialRegion}
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
      zoomEnabled={true}
      scrollEnabled={true}
      rotateEnabled={true}
      pitchEnabled={true}
    >
      {/* 기준 위치 표시 */}
      <Circle
        center={{ latitude: center[0], longitude: center[1] }}
        radius={60}
        strokeColor="#3B82F6"
        fillColor="rgba(59,130,246,0.25)"
        strokeWidth={2}
      />

      {restaurants.map((restaurant) => {
        const color = getMarkerColor(restaurant);
        const total = restaurant.pendingPrice ?? 0;
        const remaining = restaurant.minOrderAmount - total;

        return (
          <Marker
            key={restaurant.id}
            coordinate={{ latitude: restaurant.lat, longitude: restaurant.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => onRestaurantPress?.(restaurant.id)}
          >
            <View style={[styles.marker, { backgroundColor: color }]} />

            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.title}>{restaurant.name}</Text>

                <Text style={styles.meta}>
                  최소주문금액: {restaurant.minOrderAmount.toLocaleString()}원
                </Text>

                {/* ✅ “공동 장바구니가 지금까지 채워진 금액” */}
                <Text style={styles.meta}>
                  누적금액: {total.toLocaleString()}원
                </Text>

                <Text style={styles.meta}>
                  남은금액: {remaining.toLocaleString()}원
                </Text>

                <Text style={[styles.meta, styles.hint]}>(점을 누르면 메뉴로 이동)</Text>
              </View>
            </Callout>
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: "100%", height: "100%" },

  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  callout: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    color: "#111827",
  },

  meta: { fontSize: 14, color: "#4B5563", marginTop: 2 },
  hint: { marginTop: 8, fontWeight: "700" },
});