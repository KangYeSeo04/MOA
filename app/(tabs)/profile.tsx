// app/(tabs)/profile.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPaymentMethod, setPaymentMethod, type PaymentMethod } from "../lib/paymentMethod";
import { useFavoriteStore } from "../../stores/favorite";


// ✅ 여기만 "너 프로젝트에 맞는 경로"로 맞춰줘!
// 보통: ../../constants/api 또는 ../../../constants/api
import { API_BASE } from "../../constants/api";

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
  address: string | null;
};

const ADDRESS_CACHE_KEY = "profile_address_cache_v1";

export default function ProfileScreen() {
  const authUser = useAuthStore((s) => s.user);
  const doLogout = useAuthStore((s) => s.logout);

  const [showEditProfile, setShowEditProfile] = useState(false);

  // 대표주소 1개만 관리
  const [addresses, setAddresses] = useState<string[]>([]);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // ✅ 쿠폰 모달
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  const [paymentMethod, setPaymentMethodState] = useState<PaymentMethod | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [cardLabelInput, setCardLabelInput] = useState("");
  const [cardNumberInput, setCardNumberInput] = useState("");

  // ✅ 찜 모달
  const [favoriteModalVisible, setFavoriteModalVisible] = useState(false);

  // ✅ 찜 목록 (zustand)
  const favorites = useFavoriteStore((s) => s.favorites);



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

  // ✅ 서버에서 최신 프로필(+address) 가져오기
  const fetchMe = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const url = `${API_BASE}/user/me`;
      // console.log("PROFILE FETCH URL =", url);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => null);
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

      const addr = typeof me.address === "string" ? me.address.trim() : "";
      if (addr) {
        setAddresses([addr]);
        await AsyncStorage.setItem(ADDRESS_CACHE_KEY, addr);
      } else {
        setAddresses([]);
        await AsyncStorage.removeItem(ADDRESS_CACHE_KEY);
      }
    } catch (e) {
      console.log("❌ 프로필 불러오기 실패:", e);
    }
  }, []);

  const loadPaymentMethod = useCallback(async () => {
    const method = await getPaymentMethod();
    setPaymentMethodState(method);
  }, []);

  // ✅ 마이페이지가 다시 보일 때마다 갱신
  useFocusEffect(
    useCallback(() => {
      fetchMe();
      loadPaymentMethod();
    }, [fetchMe, loadPaymentMethod])
  );

  // ✅ 주소 저장 (대표주소 1개)
  const saveAddressToServer = async (addr: string) => {
    const token = await getToken();
    if (!token) throw new Error("로그인이 필요합니다.");

    const url = `${API_BASE}/user/me`;
    // console.log("PROFILE PATCH URL =", url);

    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ address: addr }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message ?? "주소 저장 실패");

    return json as MeResponse;
  };


  // ✅ 주소 삭제 (서버에 null 저장)
  const deleteAddressOnServer = async () => {
    const token = await getToken();
    if (!token) return;

    const url = `${API_BASE}/user/me`;
    await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ address: null }),
    });
  };

  const onLogoutPress = () => {
    Alert.alert("로그아웃", "로그아웃할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "로그아웃",
        style: "destructive",
        onPress: async () => {
          doLogout();
          try {
            await clearToken();
          } catch {}
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
              onPress={() => {
                setCouponCode("");
                setCouponModalVisible(true);
              }}
            />
            <OrangeIconButton
              label="찜"
              iconName="heart-outline"
              onPress={() => setFavoriteModalVisible(true)}
            />
            <OrangeIconButton
              label="나의 리뷰"
              iconName="star-outline"
              onPress={() => Alert.alert("TODO", "나의 리뷰")}
            />
          </View>
        </View>
      </View>

      {/* ✅ 쿠폰함 모달 */}
<Modal
  visible={couponModalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setCouponModalVisible(false)}
>
  <View style={styles.modalBackdrop}>
    <View style={styles.couponModalCard}>
      <Text style={styles.couponModalTitle}>쿠폰함</Text>

      {/* 상단: 쿠폰 코드 입력(검색바 느낌) */}
      <View style={styles.couponInputRow}>
        <View style={styles.couponInputWrap}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            value={couponCode}
            onChangeText={setCouponCode}
            placeholder="쿠폰 코드를 입력하세요"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="characters"
            style={styles.couponInput}
            returnKeyType="done"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.couponAddBtn,
            pressed && styles.pressed,
            !couponCode.trim() && { opacity: 0.5 },
          ]}
          disabled={!couponCode.trim()}
          onPress={() => {
            // ✅ 지금은 UI만: 추후 서버 연동 시 여기서 등록 API 호출
            Alert.alert("쿠폰 등록", `"${couponCode.trim()}" 쿠폰을 등록할게요! (TODO)`);
            setCouponCode("");
          }}
        >
          <Text style={styles.couponAddBtnText}>등록</Text>
        </Pressable>
      </View>

      {/* 아래: 등록된 쿠폰 없음 */}
      <View style={styles.couponEmptyWrap}>
        <View style={styles.couponSticker}>
          <Ionicons name="pricetag" size={22} color={ORANGE} />
        </View>

        <Text style={styles.couponEmptyTitle}>등록된 쿠폰이 없어요</Text>
        <Text style={styles.couponEmptyDesc}>
          위에 쿠폰 코드를 입력해서{"\n"}쿠폰을 등록해보세요.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.couponCloseBtn, pressed && styles.pressed]}
        onPress={() => setCouponModalVisible(false)}
      >
        <Text style={styles.couponCloseText}>닫기</Text>
      </Pressable>
    </View>
  </View>
</Modal>


{/* ✅ 찜 모달 */}
<Modal
  visible={favoriteModalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setFavoriteModalVisible(false)}
>
  <View style={styles.modalBackdrop}>
    <View style={styles.couponModalCard}>
      <Text style={styles.couponModalTitle}>찜한 가게</Text>

      {favorites.length === 0 ? (
        <View style={styles.couponEmptyWrap}>
          <View style={styles.couponSticker}>
            <Ionicons name="heart" size={22} color="#EF4444" />
          </View>

          <Text style={styles.couponEmptyTitle}>찜한 가게가 없어요</Text>
          <Text style={styles.couponEmptyDesc}>
            메뉴 화면에서 하트를 누르면{"\n"}여기에 모아볼 수 있어요.
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: 8, gap: 10 }}>
          {favorites.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => {
                setFavoriteModalVisible(false);
                router.push({
                  pathname: "/menu",
                  params: {
                    rid: String(r.id),
                    name: r.name,
                  },
                });
              }}
              style={({ pressed }) => [
                {
                  backgroundColor: "#FFFFFF",
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                },
                pressed && styles.pressed,
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Ionicons name="heart" size={18} color="#EF4444" />
                <Text style={{ fontSize: 15, fontWeight: "900", color: "#111827" }}>
                  {r.name}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>
          ))}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [styles.couponCloseBtn, pressed && styles.pressed]}
        onPress={() => setFavoriteModalVisible(false)}
      >
        <Text style={styles.couponCloseText}>닫기</Text>
      </Pressable>
    </View>
  </View>
</Modal>



      {/* 카드 리스트 영역 */}
      <View style={styles.listWrap}>
        {/* ✅ 주문 정보 */}
        <CardSection title="주문 정보">
          <MenuRow title="장바구니" onPress={() => router.push("/order_cart")} />
          <MenuRow title="주문내역" onPress={() => router.push("/orders")} />
        </CardSection>

        {/* ✅ 결제 정보 */}
        <CardSection title="결제 정보">
          <MenuRow
            title="결제수단"
            rightIcon="add-outline"
            onPress={() => {
              setCardLabelInput(paymentMethod?.label ?? "");
              setCardNumberInput("");
              setPaymentModalVisible(true);
            }}
          />
          {paymentMethod ? (
            <Text style={styles.paymentCaption}>
              {paymentMethod.label} · •••• {paymentMethod.last4}
            </Text>
          ) : null}
        </CardSection>

        {/* ✅ 주소 정보 */}
        <CardSection title="주소 정보">
          <MenuRow
            title="주소관리"
            rightIcon="add-outline"
            onPress={() => {
              setEditingIndex(null);
              setAddressInput(addresses[0] ?? "");
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
                            onPress: async () => {
                              try {
                                await deleteAddressOnServer();
                              } catch {}
                              setAddresses([]);
                              await AsyncStorage.removeItem(ADDRESS_CACHE_KEY);
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
          <MenuRow
            title="고객센터"
            onPress={() =>
              Alert.alert("고객센터", "010-7642-5299\n010-6488-8283", [
                { text: "확인" },
              ])
            }
          />
          <MenuRow
            title="주요 문의사항"
            onPress={() =>
              Alert.alert(
                "FAQ",
                "Q. 주문을 취소하고 싶어요.\nA. 결제 완료 전에는 주문서에서 취소할 수 있어요.\n\nQ. 배달이 늦어지고 있어요.\nA. 주문내역에서 배달 진행 상황을 확인해 주세요.\n\nQ. 주소를 변경할 수 있나요?\nA. 주문 전에는 마이페이지에서 주소를 수정할 수 있어요.\n\nQ. 결제수단을 변경하고 싶어요.\nA. 마이페이지에서 결제수단을 등록/수정해 주세요.",
                [{ text: "확인" }]
              )
            }
          />
        </CardSection>
      </View>

      {/* ✅ 로그아웃 버튼 */}
      <View style={styles.logoutWrap}>
        <Pressable
          onPress={onLogoutPress}
          style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
        >
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
      </View>

      {/* ✅ 결제수단 추가/수정 모달 */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>결제수단 등록</Text>

            <TextInput
              placeholder="카드 별칭 (예: 우리카드)"
              placeholderTextColor="#9CA3AF"
              value={cardLabelInput}
              onChangeText={setCardLabelInput}
              style={styles.modalInput}
            />

            <TextInput
              placeholder="카드번호 (숫자만)"
              placeholderTextColor="#9CA3AF"
              value={cardNumberInput}
              onChangeText={setCardNumberInput}
              keyboardType="number-pad"
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setPaymentModalVisible(false)}
                style={({ pressed }) => [styles.modalBtn, pressed && styles.pressed]}
              >
                <Text style={styles.modalBtnText}>취소</Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  const digits = cardNumberInput.replace(/\D/g, "");
                  if (digits.length < 4) {
                    Alert.alert("안내", "카드번호 뒤 4자리를 입력해주세요.");
                    return;
                  }

                  const label = cardLabelInput.trim() || "카드";
                  const last4 = digits.slice(-4);

                  await setPaymentMethod({ label, last4 });
                  setPaymentMethodState({ label, last4 });
                  setPaymentModalVisible(false);
                }}
                style={({ pressed }) => [styles.modalBtnPrimary, pressed && styles.pressed]}
              >
                <Text style={styles.modalBtnPrimaryText}>저장</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ 주소 추가/수정 모달 */}
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

            <TextInput
              placeholder="상세 주소작성"
              value={addressInput}
              onChangeText={setAddressInput}
              style={styles.modalInput}
              placeholderTextColor="#9CA3AF"
            />

            <Pressable
              style={({ pressed }) => [styles.modalSubmitBtn, pressed && styles.pressed]}
              onPress={async () => {
                const trimmed = addressInput.trim();
                if (!trimmed) {
                  Alert.alert("안내", "상세 주소를 입력해주세요.");
                  return;
                }

                try {
                  const updated = await saveAddressToServer(trimmed);

                  // ✅ 서버 응답값 기준으로 UI 반영
                  const addr =
                    typeof updated.address === "string" ? updated.address.trim() : trimmed;

                  setAddresses(addr ? [addr] : []);

                  if (addr) await AsyncStorage.setItem(ADDRESS_CACHE_KEY, addr);
                  else await AsyncStorage.removeItem(ADDRESS_CACHE_KEY);

                  setAddressModalVisible(false);
                  setAddressInput("");
                  setEditingIndex(null);
                } catch (e: any) {
                  Alert.alert("오류", e?.message ?? "주소 저장 실패");
                }
              }}
            >
              <Text style={styles.modalSubmitText}>
                {editingIndex === null ? "주소 등록" : "수정하기"}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.modalCancelBtn, pressed && styles.pressed]}
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

  nickname: { fontSize: 20, fontWeight: "900", color: "#111827", marginBottom: 6 },
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
    marginVertical: 15,
    marginHorizontal: 30,
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
  paymentCaption: {
    marginTop: 6,
    paddingLeft: 6,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
  },

  logoutWrap: { paddingHorizontal: 24, marginTop: 24 },
  logoutBtn: {
    backgroundColor: ORANGE,
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
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  modalBtnText: { color: "#374151", fontSize: 14, fontWeight: "800" },
  modalBtnPrimary: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ORANGE,
  },
  modalBtnPrimaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
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


  couponModalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
  },
  
  couponModalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 12,
  },
  
  couponInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  
  couponInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
  },
  
  couponInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 0, // Android에서 높이 튀는 것 방지
  },
  
  couponAddBtn: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ORANGE,
  },
  
  couponAddBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  
  couponEmptyWrap: {
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF7ED",
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 8,
  },
  
  couponSticker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  
  couponEmptyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },
  
  couponEmptyDesc: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
  
  couponCloseBtn: {
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  
  couponCloseText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "800",
  },
  
});
