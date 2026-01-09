import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  // 앱 시작 라우트를 login으로 (Expo Router 버전에 따라 무시될 수도 있어서
  // 아래 app/index.tsx Redirect도 같이 쓰는 걸 추천)
  initialRouteName: "login",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 로그인 화면 */}
        <Stack.Screen name="login" />

        {/* 탭(홈) */}
        <Stack.Screen name="(tabs)" />

        {/* 필요하면 모달 */}
        <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
