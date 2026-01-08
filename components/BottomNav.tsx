import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type PageId = 'home' | 'orders' | 'map' | 'mypage';

interface BottomNavProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
}

export function BottomNav({ currentPage, onPageChange }: BottomNavProps) {
  const navItems: Array<{
    id: PageId;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    { id: 'home', label: '홈', icon: 'home-outline' },
    { id: 'orders', label: '주문 내역', icon: 'receipt-outline' },
    { id: 'map', label: '지도', icon: 'map-outline' },
    { id: 'mypage', label: '마이페이지', icon: 'person-outline' },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const active = currentPage === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onPageChange(item.id)}
            style={styles.item}
          >
            <Ionicons
              name={item.icon}
              size={24}
              color={active ? '#F97316' : '#9CA3AF'}
            />
            <Text style={[styles.label, active ? styles.active : styles.inactive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
  },
  active: {
    color: '#F97316',
    fontWeight: '600',
  },
  inactive: {
    color: '#9CA3AF',
  },
});
