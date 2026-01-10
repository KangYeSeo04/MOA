import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { BackHandler, Platform, ToastAndroid } from "react-native";

export default function TabsLayout() {
  // ✅ 탭 어디서든 뒤로가기: 로그인으로 돌아가지 않게 처리
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#f57c00",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "홈",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: "주문내역",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "마이페이지",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}