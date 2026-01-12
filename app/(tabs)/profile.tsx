// app/(tabs)/profile.tsx
import React, { useMemo, useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ProfileEdit from "../../components/ProfileEdit"; // 기존 경로 유지
import { ImageSourcePropType } from "react-native";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { router } from "expo-router";

type ProfileData = {
  nickname: string;
  profileImage: ImageSourcePropType;
  userId: string; // 화면 표기용
};

export default function ProfileScreen() {
  const authUser = useAuthStore((s) => s.user);
  const doLogout = useAuthStore((s) => s.logout);

  // ✅ (선택) 로그아웃 시 로컬 UI 카트 상태 초기화
  // - 너희 앱은 "공동 장바구니는 서버"가 맞고,
  //   현재 stores/cart.ts는 UI 로컬 상태라 계정 바뀌면 비우는 게 자연스러움.
  const resetCartAll = useCartStore((s) => () => {
    // 간단하게 전체 초기화가 store에 없으니 아래처럼 직접 set이 필요함.
    // => store에 clearAll() 액션을 추가하는 게 제일 깔끔.
  });

  const [showEditProfile, setShowEditProfile] = useState(false);

  const derivedProfile = useMemo<ProfileData>(() => {
    const nickname = authUser?.nickname ?? authUser?.username ?? "사용자";
    const userId = authUser?.email ?? authUser?.username ?? "unknown";
    return {
      nickname,
      userId,
      profileImage: require("../../assets/images/profile.png"),
    };
  }, [authUser]);

  const [profileData, setProfileData] = useState<ProfileData>(derivedProfile);

  // authUser가 바뀌면(로그인/로그아웃/계정 변경) 화면 값도 업데이트
  React.useEffect(() => {
    setProfileData(derivedProfile);
  }, [derivedProfile]);

  const onLogoutPress = () => {
    Alert.alert("로그아웃", "로그아웃할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: () => {
          // ✅ 1) 인증 정보 제거
          doLogout();

          // ✅ 2) (권장) 로컬 UI 카트 비우기 — 계정 바꿀 때 잔상 방지
          // 아래는 store에 clearAll이 없어서 TODO로 남김.
          // 대신 “clearAll 추가” 코드를 원하면 내가 stores/cart.ts도 같이 다시 써줄게.
          // resetCartAll();

          // ✅ 3) 로그인 화면으로 이동
          router.replace("/login");
        },
      },
    ]);
  };

  if (showEditProfile) {
    return (
      <ProfileEdit
        profileData={profileData}
        onBack={() => setShowEditProfile(false)}
        onSave={(data: ProfileData) => {
          setProfileData(data);
          setShowEditProfile(false);
        }}
      />
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* 프로필 섹션 */}
      <View style={styles.topCard}>
        <View style={styles.topInner}>
          <View style={styles.avatarWrap}>
            <Image source={profileData.profileImage} style={styles.avatar} />
          </View>

          <Text style={styles.nickname}>{profileData.nickname}</Text>
          <Text style={styles.userId}>{profileData.userId}</Text>

          <Pressable
            onPress={() => setShowEditProfile(true)}
            style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
          >
            <Text style={styles.editBtnText}>내 정보 수정</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>

          {/* ✅ 로그아웃 버튼 */}
          <Pressable
            onPress={onLogoutPress}
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
          >
            <Text style={styles.logoutText}>로그아웃</Text>
          </Pressable>
        </View>
      </View>

      {/* 메뉴 리스트 */}
      <View style={styles.menuWrap}>
        <MenuRow title="주소관리" onPress={() => Alert.alert("TODO", "주소관리")} />
        <MenuRow title="결제수단" onPress={() => Alert.alert("TODO", "결제수단")} />
        <MenuRow title="쿠폰함" onPress={() => Alert.alert("TODO", "쿠폰함")} />
        <MenuRow title="고객센터" subtitle="주요 문의사항" onPress={() => Alert.alert("TODO", "고객센터")} />
      </View>
    </ScrollView>
  );
}

function MenuRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F9FAFB" },
  content: { paddingTop: 100, paddingBottom: 24 },

  topCard: {
    backgroundColor: "#FFFFFF",
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  topInner: { alignItems: "center" },

  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    marginBottom: 14,
  },
  avatar: { width: "100%", height: "100%" },

  nickname: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 6 },
  userId: { fontSize: 12, color: "#6B7280", marginBottom: 14 },

  editBtn: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editBtnText: { color: "#374151", fontSize: 15, fontWeight: "600" },

  logoutBtn: {
    width: "100%",
    maxWidth: 420,
    marginTop: 10,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { color: "white", fontSize: 15, fontWeight: "800" },

  menuWrap: {
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
    alignSelf: "center",
    width: "100%",
    maxWidth: 460,
  },

  menuItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuTitle: { color: "#111827", fontSize: 15, fontWeight: "600" },
  menuSubtitle: { marginTop: 4, color: "#6B7280", fontSize: 12 },

  pressed: { opacity: 0.85 },
});