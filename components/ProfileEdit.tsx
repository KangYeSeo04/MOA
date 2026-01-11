import React, { useState } from "react";
import type { ImageSourcePropType } from "react-native";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ProfileEditProps {
  profileData: {
    nickname: string;
    profileImage: ImageSourcePropType;
    userId: string;
  };
  onBack: () => void;
  onSave: (data: { nickname: string; profileImage: ImageSourcePropType; userId: string }) => void;
}

export default function Profile({ profileData, onBack, onSave }: ProfileEditProps) {
  const [nickname, setNickname] = useState(profileData.nickname);
  const [userId, setUserId] = useState(profileData.userId);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState(profileData.profileImage);

  const handleSave = () => {
    if (password && password !== confirmPassword) {
      Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
      return;
    }
    onSave({ nickname, profileImage, userId });
  };

  const handleImageChange = () => {
    Alert.alert("프로필 사진", "프로필 사진 변경 기능입니다.");
    // TODO: expo-image-picker 등으로 실제 이미지 선택 후 setProfileImage(uri)
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={26} color="#374151" />
        </Pressable>
        <Text style={styles.headerTitle}>내 정보 수정</Text>
        {/* 오른쪽 여백 맞추기용(센터 타이틀 느낌) */}
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Profile Image */}
          <View style={styles.profileSection}>
            <View style={styles.avatarWrap}>
            <Image
              source={profileImage ?? require("../assets/images/profile.png")}
              style={styles.avatar}
            />
              <Pressable
                onPress={handleImageChange}
                style={({ pressed }) => [styles.cameraBtn, pressed && styles.pressed]}
                hitSlop={10}
              >
                <Ionicons name="camera" size={16} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Nickname */}
            <View style={styles.field}>
              <Text style={styles.label}>닉네임</Text>
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>

            {/* UserId */}
            <View style={styles.field}>
              <Text style={styles.label}>아이디</Text>
              <TextInput
                value={userId}
                onChangeText={setUserId}
                placeholder="아이디를 입력하세요"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>새 비밀번호</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="변경할 비밀번호를 입력하세요"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Confirm Password */}
            <View style={styles.field}>
              <Text style={styles.label}>비밀번호 확인</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="비밀번호를 다시 입력하세요"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
            >
              <Text style={styles.saveBtnText}>저장</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },

  header: {
    height: 56,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },

  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },

  profileSection: { alignItems: "center", marginBottom: 24 },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
  },
  cameraBtn: {
    position: "absolute",
    right: -6,
    bottom: -6,
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  form: {
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    gap: 14,
  },

  field: { gap: 8 },
  label: { fontSize: 13, color: "#6B7280" },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },

  saveBtn: {
    marginTop: 10,
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  pressed: { opacity: 0.85 },
});
