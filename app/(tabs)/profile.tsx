import React, { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ProfileEdit from "../../components/ProfileEdit"; // 경로 맞춰줘!
import { ImageSourcePropType } from "react-native";

type ProfileData = {
  nickname: string;
  profileImage: ImageSourcePropType;
  userId: string;
};

export default function ProfileScreen() {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    nickname: "홍길동",
    userId: "user@example.com",
    profileImage: require("../../assets/images/profile.png"),
  });

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
          {/* 프로필 사진 */}
          <View style={styles.avatarWrap}>
            <Image source={profileData.profileImage} style={styles.avatar} />

          </View>

          {/* 닉네임 */}
          <Text style={styles.nickname}>{profileData.nickname}</Text>

          {/* 내 정보 수정 버튼 */}
          <Pressable
            onPress={() => setShowEditProfile(true)}
            style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
          >
            <Text style={styles.editBtnText}>내 정보 수정</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>
        </View>
      </View>

      {/* 메뉴 리스트 */}
      <View style={styles.menuWrap}>
        <MenuRow title="주소관리" onPress={() => Alert.alert("TODO", "주소관리")} />
        <MenuRow title="결제수단" onPress={() => Alert.alert("TODO", "결제수단")} />
        <MenuRow title="쿠폰함" onPress={() => Alert.alert("TODO", "쿠폰함")} />
        <MenuRow
          title="고객센터"
          subtitle="주요 문의사항"
          onPress={() => Alert.alert("TODO", "고객센터")}
        />
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

  nickname: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 16 },

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
