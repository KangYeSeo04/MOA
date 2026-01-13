import React, { useState } from "react";
import type { ImageSourcePropType } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { updateMe, changePassword } from "../app/lib/auth";
import { API_BASE } from "../constants/api";
import { getToken } from "../app/lib/auth";
import * as ImagePicker from "expo-image-picker";


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
  const [currentPassword, setCurrentPassword] = useState("");
  const [isCurrentPwVerified, setIsCurrentPwVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [savingNickname, setSavingNickname] = useState(false);
  const [saving, setSaving] = useState(false);


  const handleNicknameSave = async () => {
    const next = nickname.trim();
    if (!next) {
      Alert.alert("안내", "닉네임을 입력해주세요.");
      return;
    }
  
    try {
      setSavingNickname(true);
  
      const updated = await updateMe({ nickname: next });
  
      // 부모(ProfileScreen)의 state도 업데이트
      onSave({
        nickname: updated?.nickname ?? next,
        profileImage,
        userId,
      });
  
      Alert.alert("완료", "닉네임이 변경되었습니다.");
    } catch (e: any) {
      Alert.alert("실패", e?.message ?? "닉네임 변경 중 오류가 발생했습니다.");
    } finally {
      setSavingNickname(false);
    }
  };
  

  const handleVerifyCurrentPassword = async () => {
    if (!currentPassword) {
      Alert.alert("안내", "현재 비밀번호를 입력해주세요.");
      return;
    }
  
    setVerifying(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("토큰이 없습니다. 다시 로그인해주세요.");
  
      const res = await fetch(`${API_BASE}/user/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword }),
      });
  
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message ?? "현재 비밀번호 확인 실패");
  
      setIsCurrentPwVerified(true);
      Alert.alert("확인 완료", "현재 비밀번호가 확인되었습니다.");
    } catch (e: any) {
      setIsCurrentPwVerified(false);
      Alert.alert("실패", e?.message ?? "현재 비밀번호가 올바르지 않습니다.");
    } finally {
      setVerifying(false);
    }
  };
  
  

  const handleSave = async () => {
    if ((password || confirmPassword) && !isCurrentPwVerified) {
      Alert.alert("안내", "현재 비밀번호 확인 후 새 비밀번호를 설정할 수 있습니다.");
      return;
    }
    if (password && password !== confirmPassword) {
      Alert.alert("오류", "비밀번호가 일치하지 않습니다.");
      return;
    }
  
    try {
      setSaving(true);
  
      // 1) 닉네임 변경 (username은 건드리지 않고 nickname만)
      const updated = await updateMe({ nickname: nickname.trim() });
  
      // 2) 비밀번호 변경은 입력했을 때만
      if (password) {
        await changePassword({
          currentPassword: currentPassword.trim(),
          newPassword: password.trim(),
        });
      }
  
      // 부모 상태 반영
      onSave({
        nickname: updated?.nickname ?? nickname,
        profileImage,
        userId,
      });
  
      Alert.alert("완료", "내 정보가 저장되었습니다.");
      onBack();
    } catch (e: any) {
      Alert.alert("저장 실패", e?.message ?? "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async () => {
    try {
      // 권한 요청 (갤러리)
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("권한 필요", "갤러리 접근 권한을 허용해주세요.");
        return;
      }
  
      // 갤러리 열기
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,      // 크롭 UI
        aspect: [1, 1],           // 정사각 크롭
        quality: 0.8,
      });
  
      if (result.canceled) return;
  
      const uri = result.assets?.[0]?.uri;
      if (!uri) return;
  
      // ✅ RN Image는 { uri } 형태도 Source로 가능
      setProfileImage({ uri });
    } catch (e: any) {
      Alert.alert("오류", e?.message ?? "이미지 선택 중 오류가 발생했습니다.");
    }
  };
  

  return (
    <SafeAreaView style={styles.safe}>
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

  <View style={styles.inlineRow}>
    <TextInput
      value={nickname}
      onChangeText={setNickname}
      placeholder="닉네임을 입력하세요"
      placeholderTextColor="#9CA3AF"
      style={[styles.input, { flex: 1 }]}
      autoCapitalize="none"
    />

    <Pressable
      onPress={handleNicknameSave}
      disabled={savingNickname}
      style={({ pressed }) => [
        styles.inlineBtn,
        pressed && styles.pressed,
        savingNickname && { opacity: 0.6 },
      ]}
    >
      <Text style={styles.inlineBtnText}>
        {savingNickname ? "저장중" : "변경"}
      </Text>
    </Pressable>
  </View>
</View>

            <View style={styles.softDivider} />

            {/* Password Change Section */}
<View style={styles.passwordSection}>
  <Text style={styles.sectionHeader}>비밀번호 변경</Text>

  {/* Current Password */}
  <View style={styles.field}>
    <Text style={styles.label}>현재 비밀번호</Text>

    <View style={styles.currentPwRow}>
      <TextInput
        value={currentPassword}
        onChangeText={(t) => {
          setCurrentPassword(t);
          setIsCurrentPwVerified(false); // ✅ 비번 다시 바꾸면 재검증 필요
        }}
        placeholder="현재 비밀번호를 입력하세요"
        placeholderTextColor="#9CA3AF"
        style={[styles.input, { flex: 1 }]}
        secureTextEntry
        autoCapitalize="none"
      />

      <Pressable
        onPress={handleVerifyCurrentPassword}
        disabled={verifying}
        style={({ pressed }) => [
          styles.verifyBtn,
          pressed && styles.pressed,
          verifying && { opacity: 0.6 },
          isCurrentPwVerified && styles.verifyBtnDone,
        ]}
      >
        <Text style={styles.verifyBtnText}>
          {isCurrentPwVerified ? "확인됨" : verifying ? "확인중" : "확인"}
        </Text>
      </Pressable>
    </View>
  </View>

  {/* ✅ Verified 되었을 때만 새 비밀번호 칸들 보이기 */}
  {isCurrentPwVerified && (
    <>
      {/* New Password */}
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
    </>
    
  )}
</View>
{/* Save Button */}
<Pressable
  onPress={handleSave}
  style={({ pressed }) => [
    styles.saveBtn,
    pressed && styles.pressed,
  ]}
>
  <Text style={styles.saveBtnText}>저장</Text>
</Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },

  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  

  header: {
    height: 56,
    paddingHorizontal: 12,
    paddingTop: 3, 
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
    paddingTop: 50,
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

  softDivider: {
    height: 1,
    backgroundColor: "#D1D5DB", // 입력창 테두리/placeholder랑 같은 톤
    marginVertical: 18,         // 위아래 여백 (조절 가능)
    borderRadius: 1,
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
    backgroundColor: "#f57c00",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  pressed: { opacity: 0.85 },
  
  passwordSection: {
    gap: 14,
  },
  
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 4,
  },
  
  currentPwRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  
  verifyBtn: {
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f57c00",
  },
  
  verifyBtnDone: {
    backgroundColor: "#f57c00", // 확인됨 표시(원하면 #111827로 유지해도 됨)
  },
  
  verifyBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  
  inlineBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f57c00", // MOA 오렌지
  },
  
  inlineBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  
  
});
