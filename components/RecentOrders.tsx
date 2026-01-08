import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const recentOrders = [
  { id: 1, restaurant: '교촌치킨', menu: '허니콤보', date: '2026.01.07', image: '🍗', price: '23,000원' },
  { id: 2, restaurant: '김밥천국', menu: '참치김밥, 떡볶이', date: '2026.01.05', image: '🍜', price: '8,500원' },
  { id: 3, restaurant: '스타벅스', menu: '아메리카노, 케이크', date: '2026.01.03', image: '☕', price: '12,000원' },
  { id: 4, restaurant: '피자헛', menu: '슈퍼슈프림 L', date: '2025.12.30', image: '🍕', price: '28,000원' },
];

export function RecentOrders() {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>최근 주문 내역</Text>
      </View>

      <FlatList
        data={recentOrders}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cardOuter}>
            <View style={styles.card}>
              <Text style={styles.emoji}>{item.image}</Text>
              <Text style={styles.restaurant} numberOfLines={1}>
                {item.restaurant}
              </Text>
              <Text style={styles.menu} numberOfLines={1}>
                {item.menu}
              </Text>

              <View style={styles.bottomRow}>
                <Text style={styles.date}>{item.date}</Text>
                <Text style={styles.price}>{item.price}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const CARD_WIDTH = 170;

const styles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  header: { paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  listContent: { paddingLeft: 20, paddingRight: 8 },
  cardOuter: { paddingRight: 12 },
  card: {
    width: CARD_WIDTH,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  emoji: { fontSize: 44, textAlign: 'center', marginBottom: 10 },
  restaurant: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  menu: { fontSize: 12, color: '#4B5563', marginBottom: 10 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 11, color: '#6B7280' },
  price: { fontSize: 13, fontWeight: '700', color: '#F97316' },
});
