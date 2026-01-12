// app/(tabs)/profile.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import type { ImageSourcePropType } from "react-native";
import ProfileEdit from "../../components/ProfileEdit";
import { router } from "expo-router";
import { useAuthStore } from "../../stores/auth";
import { getToken, clearToken } from "../lib/auth";

type ProfileData = {
  nickname: string;
  profileImage: ImageSourcePropType;
  userId: string;
};

type MeResponse = {
  id: number;
  username: string;
  email: string;
  phone: string;
  nickname: string | null;
};

export default function ProfileScreen() {
  const authUser = useAuthStore((s) => s.user);
  const doLogout = useAuthStore((s) => s.logout);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // ✅ authStore 기반으로 우선 표시
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

  useEffect(() => {
    setProfileData(derivedProfile);
  }, [derivedProfile]);

  // ✅ (선택) /user/me로 최신 프로필 불러오기
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch("http://10.0.2.2:4000/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = (await res.json().catch(() => null)) as any;
        if (!res.ok) {
          console.log("❌ /user/me failed:", json);
          return;
        }

        const me = json as MeResponse;
        setProfileData((prev) => ({
          ...prev,
          nickname: me.nickname ?? me.username,
          userId: me.email ?? me.username,
        }));
      } catch (e) {
        console.log("❌ 프로필 불러오기 실패:", e);
      }
    })();
  }, []);

  const onLogoutPress = () => {
    Alert.alert("로그아웃", "로그아웃할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          // 1) auth store 비우기
          doLogout();

          // 2) token 제거
          try {
            await clearToken();
          } catch {}

          // 3) 로그인 화면
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
      <View style={styles.profileCard}>
        <View style={styles.profileInner}>
          <View style={styles.avatarWrap}>
            <Image source={profileData.profileImage} style={styles.avatar} />
          </View>

          <Text style={styles.nickname}>{profileData.nickname}</Text>
          <Text style={styles.userId}>{profileData.userId}</Text>

          <Pressable
            onPress={() => setShowEditProfile(true)}
            style={({ pressed }) => [styles.pillBtn, pressed && styles.pressed]}
          >
            <Text style={styles.pillBtnText}>내 정보 수정</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.softDivider} />

      {/* 오렌지 섹션: 쿠폰/찜/리뷰 */}
      <View style={styles.orangeWrap}>
        <View style={styles.orangeCard}>
          <View style={styles.orangeGrid}>
            <OrangeIconButton
              label="쿠폰함"
              iconName="pricetags-outline"
              onPress={() => Alert.alert("TODO", "쿠폰함")}
            />
            <OrangeIconButton
              label="찜"
              iconName="heart-outline"
              onPress={() => Alert.alert("TODO", "찜")}
            />
            <OrangeIconButton
              label="나의 리뷰"
              iconName="star-outline"
              onPress={() => Alert.alert("TODO", "나의 리뷰")}
            />
          </View>
        </View>
      </View>

      {/* 카드 리스트 영역 */}
      <View style={styles.listWrap}>
        {/* ✅ 주문 정보 */}
        <CardSection title="주문 정보">
          <MenuRow title="장바구니" onPress={() => Alert.alert("TODO", "장바구니")} />
          <MenuRow title="주문내역" onPress={() => Alert.alert("TODO", "주문내역")} />
        </CardSection>

        {/* ✅ 결제 정보 */}
        <CardSection title="결제 정보">
          <MenuRow
            title="결제수단"
            rightIcon="add-outline"
            onPress={() => Alert.alert("TODO", "결제수단")}
          />
        </CardSection>

        {/* ✅ 주소 정보 (요청: 주소관리 복구) */}
        <CardSection title="주소 정보">
          <MenuRow
            title="주소관리"
            rightIcon="add-outline"
            onPress={() => {
              setEditingIndex(null);
              setAddressInput("");
              setAddressModalVisible(true);
            }}
          />


          {/* ✅ 등록된 주소 리스트 */}
          {addresses.length > 0 && (
  <View style={{ marginTop: 10, gap: 10 }}>
    {addresses.map((addr, idx) => (
      <View key={`${addr}-${idx}`} style={styles.addressCard}>
        <Ionicons name="location-outline" size={18} color="#6B7280" />

        <Text style={styles.addressText} numberOfLines={2}>
          {addr}
        </Text>

        {/* ✅ 오른쪽 끝: 수정/삭제 */}
        <View style={styles.addressActions}>
          <Pressable
            onPress={() => {
              setEditingIndex(idx);
              setAddressInput(addr);
              setAddressModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.addressActionBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.addressActionText}>수정</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Alert.alert("삭제", "이 주소를 삭제할까요?", [
                { text: "취소", style: "cancel" },
                {
                  text: "삭제",
                  style: "destructive",
                  onPress: () => {
                    setAddresses((prev) => prev.filter((_, i) => i !== idx));
                  },
                },
              ]);
            }}
            style={({ pressed }) => [
              styles.addressActionBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.addressActionText}>삭제</Text>
          </Pressable>
        </View>
      </View>
    ))}
  </View>
)}

        </CardSection>


        {/* ✅ 고객센터 */}
        <CardSection title="고객센터">
          <MenuRow title="고객센터" onPress={() => Alert.alert("TODO", "고객센터")} />
          <MenuRow title="주요 문의사항" onPress={() => Alert.alert("TODO", "주요 문의사항")} />
        </CardSection>
      </View>

      {/* ✅ 로그아웃 버튼: UI 맨 아래 + 주황 */}
      <View style={styles.logoutWrap}>
        <Pressable
          onPress={onLogoutPress}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
        >
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
      </View>
            {/* ✅ 주소 추가 모달 */}
            <Modal
        visible={addressModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {editingIndex === null ? "주소 추가" : "주소 수정"}
          </Text>
          <Text style={styles.modalSubmitText}>
            {editingIndex === null ? "주소 등록" : "수정하기"}
          </Text>

            <TextInput
              placeholder="상세 주소작성"
              value={addressInput}
              onChangeText={setAddressInput}
              style={styles.modalInput}
              placeholderTextColor="#9CA3AF"
            />

            <Pressable
              style={({ pressed }) => [
                styles.modalSubmitBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                const trimmed = addressInput.trim();
                if (!trimmed) {
                  Alert.alert("안내", "상세 주소를 입력해주세요.");
                  return;
                }
              
                if (editingIndex === null) {
                  // ✅ 새 주소 추가
                  setAddresses((prev) => [trimmed, ...prev]);
                } else {
                  // ✅ 기존 주소 수정
                  setAddresses((prev) =>
                    prev.map((v, i) => (i === editingIndex ? trimmed : v))
                  );
                }
              
                setAddressInput("");
                setEditingIndex(null);
                setAddressModalVisible(false);
              }}
              
            >
              <Text style={styles.modalSubmitText}>주소 등록</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.modalCancelBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                setAddressInput("");
                setEditingIndex(null);
                setAddressModalVisible(false);
              }}
            >
              <Text style={styles.modalCancelText}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

/* ---------- Sub Components ---------- */

function OrangeIconButton({
  label,
  iconName,
  onPress,
}: {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.orangeBtn, pressed && styles.pressed]}
    >
      <Ionicons name={iconName} size={28} color="#FFFFFF" style={{ marginBottom: 8 }} />
      <Text style={styles.orangeBtnText}>{label}</Text>
    </Pressable>
  );
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function MenuRow({
  title,
  onPress,
  rightIcon = "chevron-forward",
}: {
  title: string;
  onPress: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
    >
      <Text style={styles.menuTitle}>{title}</Text>
      <Ionicons name={rightIcon} size={20} color="#9CA3AF" />
    </Pressable>
  );
}


/* ---------- Styles ---------- */

const ORANGE = "#f57c00";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },
  content: { paddingTop: 100, paddingBottom: 40 },

  profileCard: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  profileInner: { alignItems: "center" },

  avatarWrap: {
    width: 128,
    height: 128,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#7B9FF5",
    marginBottom: 12,
  },
  avatar: { width: "100%", height: "100%" },

  nickname: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 6 },
  userId: { fontSize: 12, color: "#6B7280", marginBottom: 12 },

  pillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    marginTop: 6,
  },
  pillBtnText: { fontSize: 13, color: "#4B5563", fontWeight: "600" },

  softDivider: {
    height: 1,
    backgroundColor: "#D1D5DB",
    marginVertical: 18,
    borderRadius: 1,
  },

  orangeWrap: { paddingHorizontal: 24, marginTop: 6 },
  orangeCard: {
    backgroundColor: ORANGE,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  orangeGrid: { flexDirection: "row", justifyContent: "space-between" },
  orangeBtn: { flex: 1, alignItems: "center", paddingVertical: 8 },
  orangeBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },

  listWrap: { paddingHorizontal: 24, marginTop: 20, gap: 16 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: { fontSize: 12, color: "#6B7280", marginBottom: 10, fontWeight: "600" },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  menuTitle: { fontSize: 15, fontWeight: "600", color: "#1F2937" },

  logoutWrap: { paddingHorizontal: 24, marginTop: 24 },
  logoutBtn: {
    backgroundColor: ORANGE, // ✅ 주황
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutText: { color: "white", fontSize: 16, fontWeight: "900" },

  pressed: { opacity: 0.85 },

    // ✅ 주소 카드
    addressCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: "#F9FAFB",
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: "#E5E7EB",
    },
    addressText: {
      flex: 1,
      fontSize: 14,
      color: "#111827",
      fontWeight: "600",
    },
  
    // ✅ 모달
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    modalCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 18,
      padding: 18,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: "#111827",
      marginBottom: 12,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 14,
      color: "#111827",
      backgroundColor: "#F9FAFB",
      marginBottom: 12,
    },
    modalSubmitBtn: {
      backgroundColor: ORANGE,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    modalSubmitText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  
    modalCancelBtn: {
      marginTop: 10,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#F3F4F6",
    },
    modalCancelText: { color: "#374151", fontSize: 14, fontWeight: "800" },

    addressActions: {
      flexDirection: "row",
      gap: 8,
    },
    
    addressActionBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "#D1D5DB",
      backgroundColor: "#FFFFFF",
    },
    
    addressActionText: {
      fontSize: 13,
      fontWeight: "800",
      color: "#111827",
    },
    
  
});