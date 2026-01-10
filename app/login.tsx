import React, { useState } from "react";
import { login } from "./lib/auth";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("안내", "아이디와 비밀번호를 입력해주세요");
      return;
    }
  
    try {
      const data = await login({ username: email.trim(), password });
      // TODO: rememberMe가 true면 token 저장(AsyncStorage)하면 됨
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("로그인 실패", e?.message ?? "아이디 또는 비밀번호가 잘못됐습니다.");
    }
  };
  

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* 헤더 */}
            <View style={styles.header}>
              <Text style={styles.title}>MOA</Text>
              <Text style={styles.subtitle}>함께 모아, 망설임 없는 주문</Text>
            </View>

            {/* 아이디 */}
            <View style={styles.field}>
              <Text style={styles.label}>아이디</Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color="#9ca3af"
                  style={styles.leftIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="아이디"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </View>

            {/* 비밀번호 */}
            <View style={styles.field}>
              <Text style={styles.label}>비밀번호</Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#9ca3af"
                  style={styles.leftIcon}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="비밀번호"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={[styles.input, styles.inputWithRightButton]}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.rightIconButton}
                  hitSlop={10}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#6b7280"
                  />
                </Pressable>
              </View>
            </View>

            {/* 기억하기 & 비밀번호 찾기 */}
            <View style={styles.rowBetween}>
              <Pressable
                onPress={() => setRememberMe((v) => !v)}
                style={styles.rememberRow}
                hitSlop={10}
              >
                <Checkbox
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  color={rememberMe ? "#f57c00" : undefined}
                  style={styles.checkbox}
                />
                <Text style={styles.rememberText}>로그인 상태 유지</Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  Alert.alert("TODO", "비밀번호 찾기 화면으로 이동")
                }
              >
                <Text style={styles.link}>비밀번호 찾기</Text>
              </Pressable>
            </View>

            {/* 로그인 버튼 */}
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryBtnText}>로그인</Text>
            </Pressable>

            {/* 구분선 */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 회원가입 */}
            <Text style={styles.bottomText}>
              계정이 없으신가요?{" "}
              <Text
                style={styles.link}
                onPress={() => router.push("/signup")}
              >
                회원가입
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
  },
  kav: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "transparent",
    borderRadius: 0,
    padding: 0,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },

  header: { alignItems: "center", marginBottom: 18 },
  title: { fontSize: 42, fontWeight: "900", color: "#f57c00", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#6b7280" },

  field: { marginTop: 12 },
  label: { fontSize: 13, color: "#374151", marginBottom: 8, fontWeight: "600" },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    backgroundColor: "white",
  },
  leftIcon: { marginLeft: 12 },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: "#111827",
  },
  inputWithRightButton: {
    paddingRight: 44,
  },
  rightIconButton: {
    position: "absolute",
    right: 12,
    padding: 4,
  },

  rowBetween: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rememberRow: { flexDirection: "row", alignItems: "center" },
  checkbox: { width: 18, height: 18 },
  rememberText: { marginLeft: 8, fontSize: 13, color: "#374151" },

  link: { color: "#f57c00", fontSize: 13, fontWeight: "600" },

  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#f57c00",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "white", fontSize: 16, fontWeight: "700" },

  divider: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#d1d5db" },
  dividerText: { color: "#6b7280", fontSize: 12 },

  bottomText: {
    marginTop: 18,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 13,
  },

  pressed: { opacity: 0.85 },
});