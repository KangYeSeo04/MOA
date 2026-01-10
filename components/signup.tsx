import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react-native";

interface SignupPageProps {
  onNavigateToLogin: () => void;
}

export function SignupPage({ onNavigateToLogin }: SignupPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const canSubmit = useMemo(() => {
    return (
      formData.username.trim().length > 0 &&
      formData.email.trim().length > 0 &&
      formData.phone.trim().length > 0 &&
      formData.password.length > 0 &&
      formData.confirmPassword.length > 0
    );
  }, [formData]);

  const handleSubmit = () => {
    if (!formData.agreeToTerms) {
      Alert.alert("안내", "이용약관에 동의해주세요");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert("안내", "비밀번호가 일치하지 않습니다");
      return;
    }

    console.log("Signup attempt:", formData);

    Alert.alert("성공", "회원가입이 완료되었습니다!", [
      { text: "확인", onPress: onNavigateToLogin },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onNavigateToLogin} style={styles.backBtn}>
            <ArrowLeft size={20} color="#4b5563" />
            <Text style={styles.backText}>로그인으로 돌아가기</Text>
          </Pressable>

          <View style={styles.brand}>
            <Text style={styles.logo}>MOA</Text>
            <Text style={styles.subtitle}>새로운 계정을 만들어보세요</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Username */}
          <Text style={styles.label}>아이디</Text>
          <View style={styles.inputWrap}>
            <User size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="아이디를 입력하세요"
              placeholderTextColor="#9ca3af"
              value={formData.username}
              onChangeText={(v) => setFormData({ ...formData, username: v })}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>이메일</Text>
          <View style={styles.inputWrap}>
            <Mail size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              placeholderTextColor="#9ca3af"
              value={formData.email}
              onChangeText={(v) => setFormData({ ...formData, email: v })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Phone */}
          <Text style={styles.label}>전화번호</Text>
          <View style={styles.inputWrap}>
            <Phone size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="010-1234-5678"
              placeholderTextColor="#9ca3af"
              value={formData.phone}
              onChangeText={(v) => setFormData({ ...formData, phone: v })}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>비밀번호</Text>
          <View style={styles.inputWrap}>
            <Lock size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor="#9ca3af"
              value={formData.password}
              onChangeText={(v) => setFormData({ ...formData, password: v })}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="next"
            />
            <Pressable onPress={() => setShowPassword((s) => !s)}>
              {showPassword ? (
                <EyeOff size={20} color="#6b7280" />
              ) : (
                <Eye size={20} color="#6b7280" />
              )}
            </Pressable>
          </View>
          <Text style={styles.hint}>8자 이상, 영문, 숫자, 특수문자 조합</Text>

          {/* Confirm Password */}
          <Text style={styles.label}>비밀번호 확인</Text>
          <View style={styles.inputWrap}>
            <Lock size={20} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 다시 입력하세요"
              placeholderTextColor="#9ca3af"
              value={formData.confirmPassword}
              onChangeText={(v) =>
                setFormData({ ...formData, confirmPassword: v })
              }
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              returnKeyType="done"
            />
            <Pressable onPress={() => setShowConfirmPassword((s) => !s)}>
              {showConfirmPassword ? (
                <EyeOff size={20} color="#6b7280" />
              ) : (
                <Eye size={20} color="#6b7280" />
              )}
            </Pressable>
          </View>

          {/* Terms */}
          <Pressable
            style={styles.termsRow}
            onPress={() =>
              setFormData({ ...formData, agreeToTerms: !formData.agreeToTerms })
            }
          >
            <View style={[styles.checkbox, formData.agreeToTerms && styles.checkboxOn]}>
              {formData.agreeToTerms ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
            <Text style={styles.termsText}>
              <Text style={styles.termsRequired}>[필수]</Text>{" "}
              이용약관 및 개인정보처리방침에 동의합니다
            </Text>
          </Pressable>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[
              styles.submitBtn,
              !canSubmit && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.submitText}>회원가입</Text>
          </Pressable>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>이미 계정이 있으신가요? </Text>
            <Pressable onPress={onNavigateToLogin}>
              <Text style={styles.loginLink}>로그인</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const ORANGE = "#f97316";

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "white" },
  container: { padding: 16, paddingTop: 32, paddingBottom: 40 },
  header: { marginBottom: 24 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 },
  backText: { color: "#4b5563", fontSize: 14 },
  brand: { alignItems: "center" },
  logo: { fontSize: 48, fontWeight: "800", color: ORANGE, marginBottom: 8 },
  subtitle: { color: "#6b7280" },

  form: { gap: 10 },
  label: { color: "#374151", fontWeight: "600", marginTop: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 56,
  },
  input: { flex: 1, color: "#111827" },
  hint: { fontSize: 12, color: "#6b7280", marginTop: 4 },

  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: ORANGE, borderColor: ORANGE },
  checkmark: { color: "white", fontWeight: "900", marginTop: -1 },

  termsText: { flex: 1, color: "#374151", fontSize: 13, lineHeight: 18 },
  termsRequired: { fontWeight: "700" },

  submitBtn: {
    marginTop: 14,
    height: 56,
    borderRadius: 14,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { color: "white", fontSize: 18, fontWeight: "700" },

  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: 10 },
  loginText: { color: "#4b5563" },
  loginLink: { color: ORANGE, fontWeight: "700" },
});