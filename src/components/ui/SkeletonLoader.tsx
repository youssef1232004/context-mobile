import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface SkeletonLineProps {
  width?: string | number;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonLine({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonLineProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: 'rgba(150,150,170,0.35)',
          opacity,
        },
        style,
      ]}
    />
  );
}

// ── Card Skeleton ─────────────────────────────────────────────────────────────
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <SkeletonLine width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonLine width="60%" height={14} />
          <SkeletonLine width="40%" height={11} />
        </View>
      </View>
      <SkeletonLine height={12} style={{ marginTop: 14 }} />
      <SkeletonLine width="80%" height={12} style={{ marginTop: 6 }} />
      <SkeletonLine width="50%" height={12} style={{ marginTop: 6 }} />
    </View>
  );
}

// ── List Item Skeleton ────────────────────────────────────────────────────────
export function SkeletonListItem({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.listItem, style]}>
      <SkeletonLine width={44} height={44} borderRadius={10} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonLine width="70%" height={14} />
        <SkeletonLine width="45%" height={11} />
      </View>
      <SkeletonLine width={24} height={24} borderRadius={12} />
    </View>
  );
}

// ── Generic Skeleton (pass custom children) ───────────────────────────────────
export function SkeletonLoader({ count = 3, type = 'card' }: { count?: number; type?: 'card' | 'list' }) {
  const items = Array.from({ length: count });
  return (
    <View style={styles.wrapper}>
      {items.map((_, i) =>
        type === 'list'
          ? <SkeletonListItem key={i} style={i > 0 ? { marginTop: 10 } : undefined} />
          : <SkeletonCard key={i} style={i > 0 ? { marginTop: 12 } : undefined} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  card: {
    backgroundColor: 'rgba(150,150,170,0.06)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(150,150,170,0.12)',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(150,150,170,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(150,150,170,0.12)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

export default SkeletonLoader;
