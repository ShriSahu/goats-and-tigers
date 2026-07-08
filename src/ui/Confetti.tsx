import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { theme } from './theme';

interface ConfettiProps {
  count?: number;
  colors?: string[];
}

interface Particle {
  left: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
}

const DEFAULT_COLORS = [theme.gold, theme.selected, theme.captureHighlight, theme.tigerBg, theme.goatBg];

/** A lightweight, one-shot celebratory burst of falling/spinning particles. No native deps. */
export function Confetti({ count = 26, colors = DEFAULT_COLORS }: ConfettiProps) {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        size: 6 + Math.random() * 6,
        color: colors[i % colors.length],
        delay: Math.random() * 300,
        duration: 1400 + Math.random() * 900,
        drift: (Math.random() - 0.5) * 80,
        spin: Math.random() > 0.5 ? 1 : -1,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count]
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((particle, i) => (
        <ConfettiPiece key={i} particle={particle} />
      ))}
    </View>
  );
}

function ConfettiPiece({ particle }: { particle: Particle }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: particle.duration,
      delay: particle.delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-20, 420] });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, particle.drift] });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [`0deg`, `${particle.spin * 540}deg`],
  });
  const opacity = progress.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${particle.left}%`,
        top: 0,
        width: particle.size,
        height: particle.size * 0.4,
        backgroundColor: particle.color,
        borderRadius: 2,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}
