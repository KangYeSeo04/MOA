import React, { useEffect } from "react";
import { View, StyleSheet, BackHandler, ToastAndroid, Platform } from "react-native";
import { router } from "expo-router";
import { Map, Restaurant } from "../../components/Map";

export default function HomeScreen() {
  const center: [number, number] = [37.498095, 127.02761];

  const restaurants: Restaurant[] = [
    {
      id: 1,
      name: "버거하우스",
      lat: 37.4986,
      lng: 127.0278,
      minOrderAmount: 20000,
      hasGroupUsers: false,
    },
  ];

  // ✅ 안드로이드 뒤로가기: 로그인으로 돌아가지 않게 처리
  useEffect(() => {
    if (Platform.OS !== "android") return;

    let lastBackPressed = 0;

    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      const now = Date.now();

      // 2초 안에 두 번 누르면 종료
      if (now - lastBackPressed < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressed = now;
      ToastAndroid.show("한 번 더 누르면 종료됩니다", ToastAndroid.SHORT);
      return true; // ✅ 기본 pop(로그인으로 복귀) 막기
    });

    return () => sub.remove();
  }, []);

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