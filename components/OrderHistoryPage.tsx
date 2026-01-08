import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const orderHistory = [
  { id: 1, restaurant: '교촌치킨', menu: '허니콤보', date: '2026.01.07', status: '배달완료', price: '23,000원' },
  { id: 2, restaurant: '김밥천국', menu: '참치김밥, 떡볶이', date: '2026.01.05', status: '배달완료', price: '8,500원' },
  { id: 3, restaurant: '스타벅스', menu: '아메리카노, 케이크', date: '2026.01.03', status: '배달완료', price: '12,000원' },
  { id: 4, restaurant: '피자헛', menu: '슈퍼슈프림 L', date: '2025.12.30', status: '배달완료', price: '28,000원' },
  { id: 5, restaurant: '맘스터치', menu: '싸이버거 세트', date: '2025.12.28', status: '배달완료', price: '7,500원' },
];

export default function OrderHistoryPage() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>주문 내역</Text>

      <View style={styles.list}>
        {orderHistory.map((order) => (
          <View key={order.id} style={styles.card}>
            <View style={styles.rowTop}>
              <Text style={styles.restaurant}>{order.restaurant}</Text>
              <Text style={styles.status}>{order.status}</Text>
            </View>

            <Text style={styles.menu}>{order.menu}</Text>

            <View style={styles.rowBottom}>
              <Text style={styles.date}>{order.date}</Text>
              <Text style={styles.price}>{order.price}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, backgroundColor: '#FFFFFF' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 18, color: '#111827' },
  list: { gap: 14 },
  card: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  restaurant: { fontSize: 16, fontWeight: '700', color: '#111827' },
  status: { fontSize: 13, color: '#16A34A', fontWeight: '600' },
  menu: { fontSize: 14, color: '#4B5563', marginBottom: 10 },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 12, color: '#6B7280' },
  price: { fontSize: 15, fontWeight: '700', color: '#F97316' },
});
