import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type CognitiveLoad = 'Light' | 'Medium' | 'Heavy';

interface Props {
  load?: string;
  compact?: boolean;
}

const CONFIG: Record<CognitiveLoad, { bars: number; color: string; label: string }> = {
  Light:  { bars: 2, color: '#10b981', label: 'Light' },
  Medium: { bars: 3, color: '#f59e0b', label: 'Medium' },
  Heavy:  { bars: 4, color: '#ef4444', label: 'Heavy' },
};

export const CognitiveLoadBadge: React.FC<Props> = ({ load, compact = false }) => {
  const { colors } = useTheme();
  const cfg = CONFIG[load as CognitiveLoad] || { bars: 1, color: '#6366f1', label: 'Pending' };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 4 : 6 }}>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              width: compact ? 3 : 4,
              height: compact ? 8 : 12,
              borderRadius: 2,
              backgroundColor: i <= cfg.bars ? cfg.color : `${cfg.color}30`,
            }}
          />
        ))}
      </View>
      {!compact && (
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            fontFamily: 'monospace',
            color: colors.text,
            opacity: 0.8,
          }}
        >
          {cfg.label}
        </Text>
      )}
    </View>
  );
};
