import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Difficulty, Side } from '../game/types';
import { GameMode } from '../hooks/useGameEngine';
import { loadItem, saveItem } from '../utils/storage';
import { RulesOverlay } from './RulesOverlay';
import { theme } from './theme';

interface HomeScreenProps {
  onStart: (mode: GameMode) => void;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const SIDE_KEY = 'gt_last_side';
const DIFFICULTY_KEY = 'gt_last_difficulty';

function isSide(value: string | null): value is Side {
  return value === 'goat' || value === 'tiger';
}

function isDifficulty(value: string | null): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

export function HomeScreen({ onStart }: HomeScreenProps) {
  const [side, setSide] = useState<Side>(() => {
    const stored = loadItem(SIDE_KEY);
    return isSide(stored) ? stored : 'goat';
  });
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    const stored = loadItem(DIFFICULTY_KEY);
    return isDifficulty(stored) ? stored : 'medium';
  });
  const [rulesVisible, setRulesVisible] = useState(false);

  useEffect(() => saveItem(SIDE_KEY, side), [side]);
  useEffect(() => saveItem(DIFFICULTY_KEY, difficulty), [difficulty]);

  const floatTiger = useFloat(0);
  const floatGoat = useFloat(400);

  return (
    <View style={styles.container}>
      <View style={styles.mascotRow}>
        <Animated.Text style={[styles.mascot, { transform: [{ translateY: floatTiger }] }]}>🐯</Animated.Text>
        <Text style={styles.vs}>VS</Text>
        <Animated.Text style={[styles.mascot, { transform: [{ translateY: floatGoat }] }]}>🐐</Animated.Text>
      </View>

      <Text style={styles.title}>Goats & Tigers</Text>
      <Text style={styles.subtitle}>Aadu Puli Aatam · Bagh Chal</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Play as</Text>
        <View style={styles.row}>
          <ChoiceButton label="🐐 Goats" active={side === 'goat'} onPress={() => setSide('goat')} />
          <ChoiceButton label="🐯 Tigers" active={side === 'tiger'} onPress={() => setSide('tiger')} />
        </View>

        <Text style={styles.sectionLabel}>Difficulty</Text>
        <View style={styles.row}>
          {DIFFICULTIES.map((d) => (
            <ChoiceButton
              key={d}
              label={d[0].toUpperCase() + d.slice(1)}
              active={difficulty === d}
              onPress={() => setDifficulty(d)}
            />
          ))}
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() => onStart({ type: 'vsAI', humanSide: side, difficulty })}
        >
          <Text style={styles.primaryButtonText}>Play vs AI</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => onStart({ type: 'passAndPlay' })}>
          <Text style={styles.secondaryButtonText}>Pass & Play (2 Players)</Text>
        </Pressable>
      </View>

      <Pressable style={styles.rulesButton} onPress={() => setRulesVisible(true)}>
        <Text style={styles.rulesButtonText}>❓ How to Play</Text>
      </Pressable>

      <RulesOverlay visible={rulesVisible} onClose={() => setRulesVisible(false)} />
    </View>
  );
}

function useFloat(phaseDelay: number) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(phaseDelay),
        Animated.timing(value, { toValue: -8, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}

function ChoiceButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.choice, active && styles.choiceActive]} onPress={onPress}>
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    marginBottom: 6,
  },
  mascot: {
    fontSize: 44,
  },
  vs: {
    color: theme.gold,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 2,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 20,
  },
  sectionLabel: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: 'transparent',
  },
  choiceActive: {
    backgroundColor: theme.pointHighlight,
    borderColor: theme.pointHighlight,
  },
  choiceText: {
    color: theme.text,
    fontWeight: '600',
  },
  choiceTextActive: {
    color: '#1b1208',
  },
  primaryButton: {
    marginTop: 24,
    backgroundColor: theme.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0a1f18',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  secondaryButtonText: {
    color: theme.textMuted,
    fontWeight: '600',
  },
  rulesButton: {
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  rulesButtonText: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
