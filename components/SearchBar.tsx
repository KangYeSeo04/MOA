import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Bell, Search } from 'lucide-react-native';

interface SearchBarProps {
  onPressSearch: () => void;
}

export function SearchBar({ onPressSearch }: SearchBarProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPressSearch}
      style={styles.container}
    >
      <View style={styles.searchWrapper}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          placeholder="식당 검색하기"
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          editable={false}   // ✅ 홈에서는 입력 막기
          pointerEvents="none"
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingTop: 30,
      
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
      backgroundColor: "white",
      borderRadius: 30,
      paddingLeft: 40,
      paddingRight: 16,
      paddingVertical: 10,
      fontSize: 14,
      color: '#111827',
    },
  });
  