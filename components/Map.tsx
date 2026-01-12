import React, { useMemo, useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker, Circle, Callout, Region } from "react-native-maps";
import { useCartStore } from "@/stores/cart";

export interface Restaurant {
  id: number;
  name: string;
  lat: number;
  lng: number;
  minOrderAmount: number;
  hasGroupUsers: boolean;
}

interface RestaurantMapProps {
  restaurants: Restaurant[];
  center: [number, number];
  onRestaurantPress?: (restaurantId: number) => void;
}

/**
 * ✅ 추천 줌 레벨: 0.004 ~ 0.008
 * - 너무 확대되면 값을 키우고
 * - 너무 축소되면 값을 줄이면 됨
 */
const DEFAULT_DELTA = 0.006;

export function Map({ restaurants, center, onRestaurantPress }: RestaurantMapProps) {
  const mapRef = useRef<MapView>(null);

  // ✅ 첫 진입에만 center로 강제 이동 (그 이후에는 화면 상태 유지)
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
      300
    );
  }, [center]);

  const totals = useCartStore((s) => s.totals);

  /**
   * 🎨 마커 색상
   * - total <= 0 -> 회색
   * - progress(0~1) 따라 연한 빨강 -> 진한 빨강
   * - NaN/Infinity 방지 (깨지면 회색으로)
   */
  const getMarkerColor = (restaurant: Restaurant) => {
    const total = Number(totals[restaurant.id] ?? 0);
    if (!Number.isFinite(total) || total <= 0) return "#9CA3AF";

    const min = Number(restaurant.minOrderAmount);
    const safeMin = Number.isFinite(min) && min > 0 ? min : 1;

    const progress = Math.max(0, Math.min(1, total / safeMin));

    const light = { r: 252, g: 165, b: 165 };
    const dark = { r: 185, g: 28, b: 28 };

    const r = Math.round(light.r + (dark.r - light.r) * progress);
    const g = Math.round(light.g + (dark.g - light.g) * progress);
    const b = Math.round(light.b + (dark.b - light.b) * progress);

    if (![r, g, b].every(Number.isFinite)) return "#9CA3AF";
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
      zoomEnabled
      scrollEnabled
      rotateEnabled
      pitchEnabled
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

        const total = Number(totals[restaurant.id] ?? 0);
        const min = Number(restaurant.minOrderAmount ?? 0);
        const remaining = Math.max(0, min - total);

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
                  최소주문금액: {Number(min).toLocaleString()}원
                </Text>
                <Text style={styles.meta}>담은금액: {Number(total).toLocaleString()}원</Text>
                <Text style={styles.meta}>남은금액: {Number(remaining).toLocaleString()}원</Text>
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