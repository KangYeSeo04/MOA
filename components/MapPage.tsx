import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MapPage() {
  return (
    <View style={styles.root}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>주변 맛집</Text>
      </View>

      {/* 지도 영역(목업) */}
      <View style={styles.mapArea}>
        <View style={styles.center}>
          <Ionicons name="location" size={64} color="#F97316" />
          <Text style={styles.subText}>지도가 표시됩니다</Text>
        </View>

        {/* 마커(목업) */}
        <View style={[styles.marker, styles.m1]}>
          <Text style={styles.emoji}>🍗</Text>
          <Text style={styles.markerText}>교촌치킨</Text>
        </View>

        <View style={[styles.marker, styles.m2]}>
          <Text style={styles.emoji}>🍕</Text>
          <Text style={styles.markerText}>피자헛</Text>
        </View>

        <View style={[styles.marker, styles.m3]}>
          <Text style={styles.emoji}>☕</Text>
          <Text style={styles.markerText}>스타벅스</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },

  mapArea: {
    flex: 1,
    backgroundColor: '#F3F4F6', // gray-100
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  center: {
    alignItems: 'center',
    gap: 10,
  },
  subText: {
    color: '#6B7280',
    fontSize: 14,
  },

  marker: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,

    // shadow (iOS)
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    // elevation (Android)
    elevation: 4,
  },
  emoji: { fontSize: 18 },
  markerText: { fontSize: 13, fontWeight: '700', color: '#111827' },

  // absolute 위치 (웹의 top/left/right/bottom 흉내)
  m1: { top: 80, left: 20 },
  m2: { top: 150, right: 24 },
  m3: { bottom: 140, left: 40 },
});
