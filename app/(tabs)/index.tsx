import React, { useState } from "react";
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

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = () => {
    // RN에서는 form submit이 없어서 버튼 onPress로 처리
    console.log("로그인 시도:", { email, password, rememberMe });
    Alert.alert("로그인 시도", `email: ${email}\nremember: ${rememberMe ? "Y" : "N"}`);
  };

  return (
    <View style={styles.screen}>
      {/* 배경 그라데이션을 완벽히 하려면 expo-linear-gradient가 필요하지만,
          일단 느낌 비슷하게 단색/톤으로 구현 */}
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
              <View style={styles.lockCircle}>
                <Ionicons name="lock-closed" size={28} color="#fff" />
              </View>
              <Text style={styles.title}>로그인</Text>
              <Text style={styles.subtitle}>계정에 로그인하세요</Text>
            </View>

            {/* 이메일 */}
            <View style={styles.field}>
              <Text style={styles.label}>이메일</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color="#9ca3af" style={styles.leftIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
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
                  placeholder="••••••••"
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
                  color={rememberMe ? "#4f46e5" : undefined}
                  style={styles.checkbox}
                />
                <Text style={styles.rememberText}>로그인 상태 유지</Text>
              </Pressable>

              <Pressable onPress={() => Alert.alert("TODO", "비밀번호 찾기 화면으로 이동")}>
                <Text style={styles.link}>비밀번호 찾기</Text>
              </Pressable>
            </View>

            {/* 로그인 버튼 */}
            <Pressable onPress={handleSubmit} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
              <Text style={styles.primaryBtnText}>로그인</Text>
            </Pressable>

            {/* 구분선 */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 소셜 로그인 */}
            <Pressable
              onPress={() => Alert.alert("TODO", "Google 로그인 연결")}
              style={({ pressed }) => [styles.socialBtn, pressed && styles.pressed]}
            >
              <Ionicons name="logo-google" size={18} color="#111827" />
              <Text style={styles.socialBtnText}>Google로 계속하기</Text>
            </Pressable>

            {/* 회원가입 링크 */}
            <Text style={styles.bottomText}>
              계정이 없으신가요?{" "}
              <Text
                style={styles.link}
                onPress={() => Alert.alert("TODO", "회원가입 화면으로 이동")}
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
    backgroundColor: "#eef2ff", // indigo-50 느낌
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
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  header: { alignItems: "center", marginBottom: 18 },
  lockCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 6 },
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

  link: { color: "#4f46e5", fontSize: 13, fontWeight: "600" },

  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#4f46e5",
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

  socialBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "white",
  },
  socialBtnText: { color: "#374151", fontSize: 14, fontWeight: "600" },

  bottomText: {
    marginTop: 18,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 13,
  },

  pressed: { opacity: 0.85 },
});