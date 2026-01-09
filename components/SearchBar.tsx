import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Bell, Search } from 'lucide-react-native';

interface SearchBarProps {
  onNotificationClick: () => void;
}

export function SearchBar({ onNotificationClick }: SearchBarProps) {
  return (
    <View style={styles.container}>
      {/* 알림 버튼 */}
      <TouchableOpacity
        onPress={onNotificationClick}
        style={styles.notificationButton}
        activeOpacity={0.7}
      >
        <Bell size={20} color="#374151" />
      </TouchableOpacity>

      {/* 검색 입력 */}
      <View style={styles.searchWrapper}>
        <Search
          size={20}
          color="#9CA3AF"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="식당 검색하기"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          returnKeyType="search"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      // shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 3, // Android
    },
    notificationButton: {
      padding: 8,
      borderRadius: 999,
    },
    searchWrapper: {
      flex: 1,
      position: 'relative',
      justifyContent: 'center',
    },
    searchIcon: {
      position: 'absolute',
      left: 12,
      zIndex: 1,
    },
    input: {
      backgroundColor: '#F3F4F6',
      borderRadius: 12,
      paddingLeft: 40,
      paddingRight: 16,
      paddingVertical: 10,
      fontSize: 14,
      color: '#111827',
    },
  });
  