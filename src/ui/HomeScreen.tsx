import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameMode } from '../hooks/useGameEngine';
import { Difficulty, Side } from '../game/types';
import { theme } from './theme';

interface HomeScreenProps {
  onStart: (mode: GameMode) => void;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export function HomeScreen({ onStart }: HomeScreenProps) {
  const [side, setSide] = useState<Side>('goat');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  return (
    <View style={styles.container}>
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

        <Pressable
          style={styles.secondaryButton}
          onPress={() => onStart({ type: 'passAndPlay' })}
        >
          <Text style={styles.secondaryButtonText}>Pass & Play (2 Players)</Text>
        </Pressable>
      </View>

      <Text style={styles.rulesHint}>
        Tigers win by capturing 5 goats. Goats win by trapping every tiger so none can move.
      </Text>
    </View>
  );
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
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 28,
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
  rulesHint: {
    marginTop: 24,
    maxWidth: 380,
    textAlign: 'center',
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
