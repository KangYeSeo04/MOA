import React, { useState } from 'react';
import { SafeAreaView, View, StyleSheet, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { SearchBar } from '../../components/SearchBar';
import { Map, Restaurant } from '../../components/Map';

// Mock 데이터
const mockRestaurants: Restaurant[] = [
  {
    id: 1,
    name: '맛있는 한식당',
    lat: 37.5665,
    lng: 126.978,
    minOrderAmount: 8000,
    hasGroupUsers: true,
  },
  {
    id: 2,
    name: '중식당 차이나',
    lat: 37.5675,
    lng: 126.979,
    minOrderAmount: 15000,
    hasGroupUsers: true,
  },
  {
    id: 3,
    name: '피자헛',
    lat: 37.5655,
    lng: 126.977,
    minOrderAmount: 4000,
    hasGroupUsers: true,
  },
  {
    id: 4,
    name: '일식당',
    lat: 37.567,
    lng: 126.976,
    minOrderAmount: 20000,
    hasGroupUsers: true,
  },
  {
    id: 5,
    name: '혼자 먹는 분식',
    lat: 37.566,
    lng: 126.98,
    minOrderAmount: 12000,
    hasGroupUsers: false,
  },
];

type TabType = 'home' | 'orders' | 'profile';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // 서울 시청 (예시)
  const myLocation: [number, number] = [37.5665, 126.978];

  const handleNotificationClick = () => {
    Alert.alert('공지사항', '공지사항 페이지로 이동');
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);

    if (tab === 'orders') {
      Alert.alert('주문 내역', '주문 내역 페이지로 이동');
    } else if (tab === 'profile') {
      Alert.alert('마이페이지', '마이페이지로 이동');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Search Bar */}
      <SearchBar onNotificationClick={handleNotificationClick} />

      {/* Map */}
      <View style={styles.mapContainer}>
        <Map restaurants={mockRestaurants} center={myLocation} />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // gray-50 느낌
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
});