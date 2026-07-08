import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { Side } from '../game/types';
import { theme } from './theme';

interface PieceVisualProps {
  side: Side;
  size: number;
}

/** A styled circular piece: gradient body, ring, subtle drop shadow, and a
 * framed emoji so tigers and goats read clearly at a glance on the board. */
export function PieceVisual({ side, size }: PieceVisualProps) {
  const isTiger = side === 'tiger';
  const gradId = isTiger ? 'tigerPieceGrad' : 'goatPieceGrad';

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={gradId} cx="35%" cy="28%" r="80%">
            <Stop offset="0%" stopColor={isTiger ? theme.tigerBg : theme.goatBg} />
            <Stop offset="100%" stopColor={isTiger ? theme.tigerBgDark : theme.goatBgDark} />
          </RadialGradient>
        </Defs>
        <Circle cx={50} cy={55} r={39} fill={theme.shadow} />
        <Circle
          cx={50}
          cy={49}
          r={39}
          fill={`url(#${gradId})`}
          stroke={isTiger ? theme.tigerRing : theme.goatRing}
          strokeWidth={4.5}
        />
        {isTiger ? (
          <>
            <Ellipse cx={28} cy={34} rx={5.5} ry={12} fill={theme.tigerRing} opacity={0.75} />
            <Ellipse cx={50} cy={26} rx={5} ry={11} fill={theme.tigerRing} opacity={0.75} />
            <Ellipse cx={72} cy={34} rx={5.5} ry={12} fill={theme.tigerRing} opacity={0.75} />
          </>
        ) : (
          <>
            <Ellipse cx={38} cy={22} rx={4} ry={9} fill={theme.goatRing} opacity={0.6} />
            <Ellipse cx={62} cy={22} rx={4} ry={9} fill={theme.goatRing} opacity={0.6} />
          </>
        )}
      </Svg>
      <View style={styles.emojiWrap} pointerEvents="none">
        <Text style={[styles.emoji, { fontSize: size * 0.5 }]}>{isTiger ? '🐯' : '🐐'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emojiWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
});
