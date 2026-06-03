import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../../context/ThemeContext';
import { Typography } from '../../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface BootSequenceScreenProps {
  onComplete: () => void;
}

export default function BootSequenceScreen({ onComplete }: BootSequenceScreenProps) {
  const { colors, isDark } = useTheme();

  // Nodes (scale and opacity pulse)
  const node1Anim = useRef(new Animated.Value(0)).current;
  const node2Anim = useRef(new Animated.Value(0)).current;
  const node3Anim = useRef(new Animated.Value(0)).current;

  // Paths (dash offset draw)
  const path1Anim = useRef(new Animated.Value(100)).current;
  const path2Anim = useRef(new Animated.Value(100)).current;
  const path3Anim = useRef(new Animated.Value(100)).current;

  // Core & Ring
  const coreScale = useRef(new Animated.Value(0.8)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;

  // Text & Dots
  const textOpacity = useRef(new Animated.Value(1)).current;
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  const fadeOutOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Helper to pulse nodes
    const createNodePulse = (anim: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0, duration: 1000, useNativeDriver: true }),
          ])
        )
      ]);
    };

    // Helper to draw paths
    const createPathDraw = (anim: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 0, duration: 1000, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 100, duration: 1000, useNativeDriver: true }),
          ])
        )
      ]);
    };

    createNodePulse(node1Anim, 0).start();
    createPathDraw(path1Anim, 0).start();

    createNodePulse(node2Anim, 600).start();
    createPathDraw(path2Anim, 600).start();

    createNodePulse(node3Anim, 1200).start();
    createPathDraw(path3Anim, 1200).start();

    // Pulse Core
    Animated.loop(
      Animated.sequence([
        Animated.timing(coreScale, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(coreScale, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Text Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(textOpacity, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // Sequential Dots
    const createDotAnim = (anim: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
            Animated.delay(400) // wait for other dots
          ])
        )
      ]);
    };

    createDotAnim(dot1Opacity, 0).start();
    createDotAnim(dot2Opacity, 400).start();
    createDotAnim(dot3Opacity, 800).start();

    // Trigger completion
    const timer = setTimeout(() => {
      Animated.timing(fadeOutOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const getNodeScale = (anim: Animated.Value) => anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] });
  const getNodeOpacity = (anim: Animated.Value) => anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  // Node 1: text-light-text/70 | Node 2: text-light-text/70 | Node 3: accent
  const node1Color = isDark ? 'rgba(224, 224, 230, 0.8)' : 'rgba(36, 44, 52, 0.7)';
  const node2Color = node1Color;
  // Node 3: light-accent (#ff7e5f) / dark-secondary (#3b82f6)
  const node3Color = isDark ? '#3b82f6' : '#ff7e5f'; 

  // Path 1 & 2: light-primary/40 (#103766) / dark-primary/50 (#8b5cf6)
  const pathColor = isDark ? 'rgba(139, 92, 246, 0.5)' : 'rgba(16, 55, 102, 0.4)';
  // Path 3: light-accent/70 (#ff7e5f) / dark-secondary/80 (#3b82f6)
  const path3Color = isDark ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255, 126, 95, 0.7)';
  // Ring: light-primary/15 (#103766) / dark-primary/30 (#8b5cf6)
  const ringColor = isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(16, 55, 102, 0.15)';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={{ opacity: fadeOutOpacity, alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Main SVG */}
        <View style={{ width: 150, height: 150 }}>
          <Svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            
            {/* Paths */}
            <AnimatedPath d="M25 25 C 25 25, 40 45, 50 50" strokeWidth="5" strokeLinecap="round" stroke={pathColor} strokeDasharray={100} strokeDashoffset={path1Anim} fill="none" />
            <AnimatedPath d="M75 25 C 75 25, 60 45, 50 50" strokeWidth="5" strokeLinecap="round" stroke={pathColor} strokeDasharray={100} strokeDashoffset={path2Anim} fill="none" />
            <AnimatedPath d="M50 80 C 50 80, 50 65, 50 50" strokeWidth="5" strokeLinecap="round" stroke={path3Color} strokeDasharray={100} strokeDashoffset={path3Anim} fill="none" />

            {/* Nodes */}
            <AnimatedCircle cx="25" cy="25" r="7" fill={node1Color} opacity={getNodeOpacity(node1Anim)} origin="25, 25" scale={getNodeScale(node1Anim)} />
            <AnimatedCircle cx="75" cy="25" r="7" fill={node2Color} opacity={getNodeOpacity(node2Anim)} origin="75, 25" scale={getNodeScale(node2Anim)} />
            <AnimatedCircle cx="50" cy="80" r="7" fill={node3Color} opacity={getNodeOpacity(node3Anim)} origin="50, 80" scale={getNodeScale(node3Anim)} />

            {/* Core & Ring */}
            <AnimatedCircle cx="50" cy="50" r="14" fill={colors.primary} origin="50, 50" scale={coreScale} />
            <Circle cx="50" cy="50" r="22" strokeWidth="2" stroke={ringColor} fill="none" />
            
          </Svg>
        </View>

        {/* Text */}
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <Animated.Text
            style={{
              fontFamily: Typography.families.mono,
              fontSize: Typography.sizes.sm,
              fontWeight: '700',
              letterSpacing: 2,
              color: colors.primary,
              textTransform: 'uppercase',
              opacity: textOpacity,
            }}
          >
            Initializing Context Engine
          </Animated.Text>
          
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
            {[dot1Opacity, dot2Opacity, dot3Opacity].map((opacityAnim, i) => (
              <Animated.View
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.primary,
                  opacity: opacityAnim,
                }}
              />
            ))}
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
