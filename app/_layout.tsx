// app/_layout.tsx
// 이 파일은 앱의 최상위 진입점입니다. Stack으로 로그인과 탭을 감쌉니다.

import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 1. 로그인 관련 화면들 (탭 없음) */}
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />

      {/* 2. 메인 탭 화면 (로그인 후 이동하는 곳) 
          여기서 app/(tabs)/_layout.tsx의 설정이 적용됩니다. 
      */}
      <Stack.Screen name="(tabs)" />

      {/* 기타 화면들 */}
      <Stack.Screen name="menu" options={{ presentation: 'modal' }} />
    </Stack>
  );
}