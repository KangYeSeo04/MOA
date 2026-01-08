import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const menuItems = [
  { icon: 'card-outline' as const, label: '결제 수단 관리' },
  { icon: 'notifications-outline' as const, label: '알림 설정' },
  { icon: 'settings-outline' as const, label: '설정' },
];

export default function MyPage() {
  return (
    <View style={styles.root}>
      <Text style={styles.pageTitle}>마이페이지</Text>

      {/* 프로필 영역 */}
      <View style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color="#F97316" />
          </View>

          <View>
            <Text style={styles.name}>홍길동님</Text>
            <Text style={styles.email}>gildong@example.com</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>보유 쿠폰</Text>
            <Text style={styles.statValue}>3장</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>포인트</Text>
            <Text style={styles.statValue}>1,500P</Text>
          </View>
        </View>
      </View>

      {/* 메뉴 리스트 */}
      <View style={styles.menuList}>
        {menuItems.map((item, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
            onPress={() => {}}
          >
            <View style={styles.menuLeft}>
              <Ionicons name={item.icon} size={20} color="#4B5563" />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 18,
    color: '#111827',
  },

  // 그라데이션 대신 단색(원하면 LinearGradient로 바꿔줄게)
  profileCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    backgroundColor: '#FB923C', // orange 느낌
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  menuList: {
    gap: 10,
    marginTop: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',

    // shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  menuItemPressed: {
    backgroundColor: '#F9FAFB',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
});
