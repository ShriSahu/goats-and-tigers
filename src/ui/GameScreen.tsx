import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { GOATS_CAPTURED_TO_WIN } from '../game/types';
import { GameMode, useGameEngine } from '../hooks/useGameEngine';
import { BoardView } from './BoardView';
import { theme } from './theme';

interface GameScreenProps {
  mode: GameMode;
  onExit: () => void;
}

const screenWidth = Dimensions.get('window').width;
const BOARD_SIZE = Math.min(screenWidth - 32, 420);

export function GameScreen({ mode, onExit }: GameScreenProps) {
  const engine = useGameEngine(mode);
  const { state } = engine;

  const turnLabel = describeTurn(mode, state.turn, engine.isHumanTurn, engine.aiThinking);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onExit} style={styles.exitButton}>
          <Text style={styles.exitButtonText}>← Home</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Goats & Tigers</Text>
        <Pressable onPress={engine.reset} style={styles.exitButton}>
          <Text style={styles.exitButtonText}>Restart</Text>
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        <StatusChip label="Captured" value={`${state.goatsCaptured} / ${GOATS_CAPTURED_TO_WIN}`} />
        <StatusChip
          label={state.phase === 'placement' ? 'Goats to place' : 'Phase'}
          value={state.phase === 'placement' ? String(state.goatsToPlace) : 'Movement'}
        />
      </View>

      <Text style={styles.turnLabel}>{turnLabel}</Text>

      <BoardView
        board={state.board}
        size={BOARD_SIZE}
        selected={engine.selected}
        destinations={engine.destinations}
        captureDestinations={engine.captureDestinations}
        onPointPress={engine.onPointPress}
        disabled={!engine.isHumanTurn || engine.aiThinking || !!state.winner}
      />

      {state.winner && (
        <View style={styles.winOverlay}>
          <View style={styles.winCard}>
            <Text style={styles.winEmoji}>{state.winner === 'tiger' ? '🐯' : '🐐'}</Text>
            <Text style={styles.winTitle}>
              {state.winner === 'tiger' ? 'Tigers Win!' : 'Goats Win!'}
            </Text>
            <Text style={styles.winReason}>
              {state.winner === 'tiger'
                ? `Tigers captured ${state.goatsCaptured} goats.`
                : 'Every tiger is trapped with no legal move.'}
            </Text>
            <Pressable style={styles.primaryButton} onPress={engine.reset}>
              <Text style={styles.primaryButtonText}>Play Again</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={onExit}>
              <Text style={styles.secondaryButtonText}>Home</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function describeTurn(
  mode: GameMode,
  turn: 'tiger' | 'goat',
  isHumanTurn: boolean,
  aiThinking: boolean
): string {
  const side = turn === 'tiger' ? 'Tigers' : 'Goats';
  if (mode.type === 'passAndPlay') return `${side} to move`;
  if (aiThinking) return `${side} (AI) thinking…`;
  return isHumanTurn ? `Your turn — ${side}` : `${side} (AI) to move`;
}

function StatusChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  header: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 16,
  },
  exitButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  exitButtonText: {
    color: theme.textMuted,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 120,
  },
  chipLabel: {
    color: theme.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipValue: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 16,
    marginTop: 2,
  },
  turnLabel: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 14,
  },
  winOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winCard: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    minWidth: 260,
  },
  winEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  winTitle: {
    color: theme.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  winReason: {
    color: theme.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: theme.success,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#0a1f18',
    fontWeight: '800',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  secondaryButtonText: {
    color: theme.textMuted,
    fontWeight: '600',
  },
});
