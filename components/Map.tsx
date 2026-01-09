import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Circle, Callout, Region } from 'react-native-maps';

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
  center: [number, number]; // [lat, lng]
}

export function Map({ restaurants, center }: RestaurantMapProps) {
  const region: Region = useMemo(
    () => ({
      latitude: center[0],
      longitude: center[1],
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
    [center]
  );

  const getMarkerColor = (restaurant: Restaurant) => {
    if (!restaurant.hasGroupUsers) return '#9CA3AF'; // 회색
    if (restaurant.minOrderAmount < 5000) return '#10B981'; // 초록
    if (restaurant.minOrderAmount <= 15000) return '#F59E0B'; // 주황
    return '#EF4444'; // 빨강
  };

  return (
    <MapView
      style={styles.map}
      initialRegion={region}
      // center가 바뀔 때도 따라가고 싶으면 아래 주석 해제:
      // region={region}
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

        return (
          <Marker
            key={restaurant.id}
            coordinate={{ latitude: restaurant.lat, longitude: restaurant.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            {/* 커스텀 원형 마커 (Leaflet divIcon 대체) */}
            <View style={[styles.marker, { backgroundColor: color }]} />

            {/* 팝업 (Leaflet popup 대체) */}
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.title}>{restaurant.name}</Text>
                <Text style={styles.meta}>
                  최소주문금액: {restaurant.minOrderAmount.toLocaleString()}원
                </Text>
                <Text style={styles.meta}>
                  공동주문: {restaurant.hasGroupUsers ? '가능' : '없음'}
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
  map: {
    width: '100%',
    height: '100%',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Android shadow
    elevation: 6,
  },
  callout: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 180,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#111827',
  },
  meta: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
});
