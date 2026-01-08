import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecentOrders } from './RecentOrders';

const categories = [
  { name: '치킨', icon: '🍗' },
  { name: '분식', icon: '🍜' },
  { name: '중식', icon: '🥟' },
  { name: '카페(디저트)', icon: '☕' },
  { name: '피자', icon: '🍕' },
  { name: '찜(탕)', icon: '🍲' },
  { name: '돈까스', icon: '🍛' },
  { name: '회', icon: '🍣' },
  { name: '한식', icon: '🍚' },
];

export default function HomePage() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 검색 영역 - 화면의 2/5 정도 위치 */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            placeholder="음식, 가게를 검색하세요"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* 광고 배너 */}
      <View style={styles.section}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>🎉 첫 주문 3,000원 할인!</Text>
        </View>
      </View>

      {/* 카테고리 */}
      <View style={[styles.section, { marginBottom: 24 }]}>
        <Text style={styles.sectionTitle}>카테고리</Text>

        <View style={styles.grid}>
          {categories.map((category, index) => (
            <Pressable key={index} style={styles.catItem}>
              <View style={styles.catCircle}>
                <Text style={styles.catEmoji}>{category.icon}</Text>
              </View>
              <Text style={styles.catLabel} numberOfLines={2}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 최근 주문 내역 */}
      <RecentOrders />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },

  // 웹의 pt-[40vh] 느낌: RN에서는 고정값으로 타협(원하면 화면 높이에 맞춰 동적으로도 가능)
  searchWrap: {
    paddingTop: 260,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  searchBox: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingLeft: 44,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 12,
  },
  searchInput: {
    fontSize: 16,
    color: '#111827',
  },

  section: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  banner: {
    height: 128,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // RN 기본만으로 그라데이션은 안 됨(라이브러리 필요). 일단 컬러로 대체
    backgroundColor: '#FB923C',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    color: '#111827',
  },

  // grid-cols-5 대체: flexWrap로 5개씩 보이게 너비 계산
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  catItem: {
    width: '18%', // 대략 5열 느낌 (gap 고려)
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  catCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFEDD5', // orange-100
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmoji: {
    fontSize: 22,
  },
  catLabel: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 14,
  },
});
