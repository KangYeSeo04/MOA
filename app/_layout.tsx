import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  initialRouteName: "login",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 로그인 */}
        <Stack.Screen name="login" />

        {/* 탭(홈/주문내역/마이페이지) */}
        <Stack.Screen name="(tabs)" />

        {/* ✅ 탭에서 push로 들어가는 "상세/서브 화면"들 (예: 메뉴판) */}
        <Stack.Screen name="(app)" />

        {/* 모달 */}
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}