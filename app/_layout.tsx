import React from "react";
import { Stack } from "expo-router";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/auth";
import { OrderCompletionWatcher } from "../components/OrderCompletionWatcher";

export default function RootLayout() {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);

  // persist 복구 전에는 아무것도 안 하고 대기 (깜빡임/잘못된 리다이렉트 방지)
  if (!hydrated) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  // ✅ 토큰 있으면 로그인 화면 못 가게 tabs로, 없으면 login으로
  // (네 구조에서 로그인 페이지는 /login 이었음)
  if (!token) {
    return (
      <>
        <Stack screenOptions={{ headerShown: false }} />
        <Redirect href="/login" />
      </>
    );
  }

  return (
    <>
      <OrderCompletionWatcher />
      <Stack screenOptions={{ headerShown: false }} />
      <Redirect href="/(tabs)" />
    </>
  );
}
