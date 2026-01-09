import React from "react";
import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Map, Restaurant } from "../../components/Map";

export default function HomeScreen() {
  const center: [number, number] = [37.498095, 127.02761];

  // ✅ 회색 점 1개만 뜨게: restaurant 1개만 둔다
  const restaurants: Restaurant[] = [
    {
      id: 1,
      name: "버거하우스",
      lat: 37.4986,
      lng: 127.0278,
      minOrderAmount: 20000, // ✅ 회색 매장 최소주문금액 2만원
      hasGroupUsers: false,
    },
  ];

  return (
    <View style={styles.container}>
      <Map
        restaurants={restaurants}
        center={center}
        onRestaurantPress={(rid) =>
          router.push({ pathname: "/(app)/menu", params: { rid: String(rid) } })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});