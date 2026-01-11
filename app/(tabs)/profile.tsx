import React, { useEffect, useState } from "react";
import { getToken } from "../lib/auth";

import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ImageSourcePropType } from "react-native";
import ProfileEdit from "../../components/ProfileEdit"; // ✅ components에 있으니 이 경로 맞음

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
  const [showEditProfile, setShowEditProfile] = useState(false);

  // ✅ 기본 이미지: app/(tabs)/profile.tsx 기준으로 ../../assets/... 가 맞음
  const [profileData, setProfileData] = useState<ProfileData>({
    nickname: "분홍샌들의겁손한치타",
    userId: "user@example.com",
    profileImage: require("../../assets/images/profile.png"),
  });

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          // 나중에 로그인 화면으로 보내고 싶으면 여기서 router.replace("/login")
          return;
        }

        const res = await fetch("http://10.0.2.2:4000/user/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const me: MeResponse = await res.json();
        if (!res.ok) {
          throw new Error((me as any)?.message ?? "failed to load profile");
        }

        setProfileData((prev) => ({
          ...prev,
          nickname: me.nickname ?? me.username,
          userId: me.email, // 또는 me.username
        }));
      } catch (e) {
        console.log("❌ 프로필 불러오기 실패:", e);
      }
    })();
  }, []);

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
          {/* 프로필 사진 */}
            <View style={styles.avatarWrap}>
              <Image source={profileData.profileImage} style={styles.avatar} />
            </View>

          {/* 닉네임 */}
          <Text style={styles.nickname}>{profileData.nickname}</Text>

          {/* 내 정보 수정 버튼(웹의 pill 버튼 느낌) */}
          <Pressable
            onPress={() => setShowEditProfile(true)}
            style={({ pressed }) => [styles.pillBtn, pressed && styles.pressed]}
          >
            <Text style={styles.pillBtnText}>내 정보 수정</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.softDivider} />

      {/* 오렌지 섹션: 쿠폰함/찜/나의 리뷰 */}
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
        {/* 주문 정보 */}
        <CardSection title="주문 정보">
          <MenuRow title="장바구니" onPress={() => Alert.alert("TODO", "장바구니")} />
          <MenuRow title="주문내역" onPress={() => Alert.alert("TODO", "주문내역")} />
        </CardSection>

        {/* 결제 정보 */}
        <CardSection title="결제 정보">
          <MenuRow title="결제 수단" onPress={() => Alert.alert("TODO", "결제 수단")} />
        </CardSection>

        {/* 주소 정보 */}
        <CardSection title="주소 정보">
          <MenuRow title="정보 수정" onPress={() => Alert.alert("TODO", "정보 수정")} />
        </CardSection>

        {/* 고객센터 */}
        <CardSection title="기타">
          <MenuRow title="고객센터" onPress={() => Alert.alert("TODO", "고객센터")} />
          <MenuRow title="주요 문의사항" onPress={() => Alert.alert("TODO", "주요 문의사항")} />
        </CardSection>
      </View>
    </ScrollView>
  );
}

/** 오렌지 카드 안의 아이콘 버튼 (웹 grid-cols-3 느낌) */
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.orangeBtn, pressed && styles.pressed]}>
      <Ionicons name={iconName} size={28} color="#FFFFFF" style={{ marginBottom: 8 }} />
      <Text style={styles.orangeBtnText}>{label}</Text>
    </Pressable>
  );
}

/** 섹션 카드 */
function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/** 메뉴 row (웹의 hover row 느낌) */
function MenuRow({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" }, // gray-50 느낌
  content: { paddingTop: 100, paddingBottom: 28 },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#111827" },

  profileCard: {
    //backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  profileInner: { alignItems: "center" },

  avatarWrap: {
    width: 128,
    height: 128,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#7B9FF5", // 피그마 코드에서 배경색
    marginBottom: 12,
  },
  avatar: { width: "100%", height: "100%" },

  nickname: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 12 },

  pillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  pillBtnText: { fontSize: 13, color: "#4B5563", fontWeight: "600" },

  orangeWrap: { paddingHorizontal: 24, marginTop: 16 },
  orangeCard: {
    backgroundColor: "#f57c00",
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    elevation: 4,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  orangeGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orangeBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  orangeBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },

  listWrap: {
    paddingHorizontal: 24,
    marginTop: 20,
    gap: 16,
  },

  

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

  pressed: { opacity: 0.85 },

  softDivider: {
    height: 1,
    backgroundColor: "#D1D5DB", // 입력창 테두리/placeholder랑 같은 톤
    marginVertical: 18,         // 위아래 여백 (조절 가능)
    borderRadius: 1,
  },
  
});
