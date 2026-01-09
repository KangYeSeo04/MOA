import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker, Circle, Callout, Region } from "react-native-maps";
import { useCartStore } from "@/stores/cart"; // ✅ alias 안되면 아래 "대체 import" 참고

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
  onRestaurantPress?: (restaurantId: number) => void; // ✅ 마커(점) 클릭 콜백
}

export function Map({ restaurants, center, onRestaurantPress }: RestaurantMapProps) {
  const region: Region = useMemo(
    () => ({
      latitude: center[0],
      longitude: center[1],
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
    [center]
  );

  const totals = useCartStore((s) => s.totals);

  // ✅ 담은 금액 기준으로 색
  // total=0 -> 회색
  // remaining <= 10000 -> 초록
  // remaining > 10000 -> 빨강
  const getMarkerColor = (restaurant: Restaurant) => {
    const total = totals[restaurant.id] ?? 0;
    if (total <= 0) return "#9CA3AF"; // 회색

    const remaining = restaurant.minOrderAmount - total;
    if (remaining <= 10000) return "#10B981"; // 초록
    return "#EF4444"; // 빨강
  };

  return (
    <MapView
      style={styles.map}
      initialRegion={region}
      showsCompass={false}
      showsMyLocationButton={false}
      toolbarEnabled={false}
    >
      {/* 내 위치 표시 (파란 원) */}
      <Circle
        center={{ latitude: center[0], longitude: center[1] }}
        radius={50}
        strokeColor="#3B82F6"
        fillColor="rgba(59,130,246,0.3)"
        strokeWidth={2}
      />

      {/* 식당 마커 */}
      {restaurants.map((restaurant) => {
        const color = getMarkerColor(restaurant);
        const total = totals[restaurant.id] ?? 0;
        const remaining = restaurant.minOrderAmount - total;

        return (
          <Marker
            key={restaurant.id}
            coordinate={{ latitude: restaurant.lat, longitude: restaurant.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            onPress={() => onRestaurantPress?.(restaurant.id)} // ✅ 점 클릭 -> 메뉴 이동
          >
            <View style={[styles.marker, { backgroundColor: color }]} />

            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.title}>{restaurant.name}</Text>
                <Text style={styles.meta}>
                  최소주문금액: {restaurant.minOrderAmount.toLocaleString()}원
                </Text>
                <Text style={styles.meta}>
                  담은금액: {total.toLocaleString()}원
                </Text>
                <Text style={styles.meta}>
                  남은금액: {remaining.toLocaleString()}원
                </Text>
                <Text style={[styles.meta, { marginTop: 8, fontWeight: "700" }]}>
                  (점을 누르면 메뉴로 이동)
                </Text>
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
    fontWeight: "600",
    marginBottom: 4,
    color: "#111827",
  },
  meta: { fontSize: 14, color: "#4B5563", marginTop: 2 },
});