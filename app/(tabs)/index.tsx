import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { BottomNav } from '../../components/BottomNav';
import HomePage from '../../components/HomePage';
import MapPage from '../../components/MapPage';
import MyPage from '../../components/MyPage';
import OrderHistoryPage from '../../components/OrderHistoryPage';

type PageId = 'home' | 'orders' | 'map' | 'mypage';

export default function HomeTab() {
  const [page, setPage] = useState<PageId>('home');

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        {page === 'home' && <HomePage />}
        {page === 'orders' && <OrderHistoryPage />}
        {page === 'map' && <MapPage />}
        {page === 'mypage' && <MyPage />}
      </View>

      <BottomNav currentPage={page} onPageChange={setPage} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, paddingBottom: 64 }, // 네비에 가려지지 않게
});
