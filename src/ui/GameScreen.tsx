import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { isSoundMuted, playSound, setSoundMuted } from '../audio/sound';
import { GOATS_CAPTURED_TO_WIN, TOTAL_GOATS } from '../game/types';
import { GameMode, HintMove, useGameEngine } from '../hooks/useGameEngine';
import { useCrossfadeText } from '../hooks/useCrossfadeText';
import { haptics, setHapticsEnabled } from '../utils/haptics';
import { loadItem, saveItem } from '../utils/storage';
import { BoardView } from './BoardView';
import { Confetti } from './Confetti';
import { RulesOverlay } from './RulesOverlay';
import { theme } from './theme';

interface GameScreenProps {
  mode: GameMode;
  onExit: () => void;
}

const screenWidth = Dimensions.get('window').width;
const BOARD_SIZE = Math.min(screenWidth - 32, 420);
const MUTE_KEY = 'gt_muted';

export function GameScreen({ mode, onExit }: GameScreenProps) {
  const engine = useGameEngine(mode);
  const { state } = engine;

  const [rulesVisible, setRulesVisible] = useState(false);
  const [muted, setMuted] = useState(() => {
    const stored = loadItem(MUTE_KEY);
    return stored === '1' || isSoundMuted();
  });
  const [hintMove, setHintMove] = useState<HintMove | null>(null);

  const shake = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const winCardScale = useRef(new Animated.Value(0.6)).current;

  const prevMoveCountRef = useRef(state.moveHistory.length);
  const prevWinnerRef = useRef(state.winner);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSoundMuted(muted);
    setHapticsEnabled(!muted);
    saveItem(MUTE_KEY, muted ? '1' : '0');
  }, [muted]);

  useEffect(() => {
    const prevCount = prevMoveCountRef.current;
    prevMoveCountRef.current = state.moveHistory.length;
    if (state.moveHistory.length <= prevCount) return;

    const move = state.lastMove;
    if (!move) return;

    setHintMove(null);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);

    if (move.kind === 'capture') {
      playSound('capture');
      haptics.capture();
      triggerCaptureShake();
    } else if (move.kind === 'place') {
      playSound('place');
      haptics.move();
    } else {
      playSound('step');
      haptics.move();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.moveHistory.length]);

  useEffect(() => {
    if (state.winner && state.winner !== prevWinnerRef.current) {
      const humanWins = mode.type === 'passAndPlay' ? true : state.winner === mode.humanSide;
      playSound(state.winner === 'tiger' ? 'tigerWin' : 'goatWin');
      if (humanWins) haptics.win();
      else haptics.lose();
      winCardScale.setValue(0.6);
      Animated.spring(winCardScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
    }
    prevWinnerRef.current = state.winner;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.winner]);

  function triggerCaptureShake() {
    flash.setValue(1);
    Animated.timing(flash, { toValue: 0, duration: 380, useNativeDriver: true }).start();
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 45, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 90, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function onHintPress() {
    haptics.select();
    const move = engine.getHint();
    setHintMove(move);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    if (move) {
      hintTimerRef.current = setTimeout(() => setHintMove(null), 2600);
    }
  }

  function onPointPress(id: number) {
    if (hintMove) setHintMove(null);
    engine.onPointPress(id);
  }

  const turnLabel = describeTurn(mode, state.turn, engine.isHumanTurn, engine.aiThinking);
  const { display: displayedTurnLabel, opacity: turnOpacity } = useCrossfadeText(turnLabel);
  const goatsOnBoard = TOTAL_GOATS - state.goatsToPlace - state.goatsCaptured;
  const shakeTranslate = shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] });
  const flashOpacity = flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.3] });

  const hintAvailable =
    engine.isHumanTurn && !engine.aiThinking && !state.winner && !hintMove && engine.selected === null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onExit} style={styles.iconButton}>
          <Text style={styles.iconButtonText}>← Home</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Goats & Tigers</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={() => setRulesVisible(true)} style={styles.iconButton} hitSlop={6}>
            <Text style={styles.iconGlyph}>❓</Text>
          </Pressable>
          <Pressable onPress={() => setMuted((m) => !m)} style={styles.iconButton} hitSlop={6}>
            <Text style={styles.iconGlyph}>{muted ? '🔇' : '🔊'}</Text>
          </Pressable>
          <Pressable onPress={engine.reset} style={styles.iconButton}>
            <Text style={styles.iconButtonText}>Restart</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.statusRow}>
        <StatusChip label="Captured" value={`${state.goatsCaptured} / ${GOATS_CAPTURED_TO_WIN}`} />
        <StatusChip
          label={state.phase === 'placement' ? 'To place' : 'Goats left'}
          value={state.phase === 'placement' ? String(state.goatsToPlace) : String(goatsOnBoard)}
        />
        {mode.type === 'vsAI' && (
          <StatusChip label="Difficulty" value={mode.difficulty[0].toUpperCase() + mode.difficulty.slice(1)} />
        )}
      </View>

      <View style={styles.turnRow}>
        <Animated.Text style={[styles.turnLabel, { opacity: turnOpacity }]}>{displayedTurnLabel}</Animated.Text>
        {engine.aiThinking && <ThinkingDots />}
      </View>

      <Animated.View style={{ width: BOARD_SIZE, transform: [{ translateX: shakeTranslate }] }}>
        <BoardView
          board={state.board}
          size={BOARD_SIZE}
          selected={engine.selected}
          destinations={engine.destinations}
          captureDestinations={engine.captureDestinations}
          onPointPress={onPointPress}
          disabled={!engine.isHumanTurn || engine.aiThinking || !!state.winner}
          lastMove={state.lastMove}
          moveNumber={state.moveHistory.length}
          hint={hintMove}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.captureFlash,
            { width: BOARD_SIZE, height: BOARD_SIZE, opacity: flashOpacity },
          ]}
        />
      </Animated.View>

      <Pressable
        onPress={onHintPress}
        disabled={!hintAvailable}
        style={[styles.hintButton, !hintAvailable && styles.hintButtonDisabled]}
      >
        <Text style={styles.hintButtonText}>💡 Hint</Text>
      </Pressable>

      <RulesOverlay visible={rulesVisible} onClose={() => setRulesVisible(false)} />

      {state.winner && (
        <View style={styles.winOverlay}>
          <Confetti />
          <Animated.View style={[styles.winCard, { transform: [{ scale: winCardScale }] }]}>
            <Text style={styles.winEmoji}>{state.winner === 'tiger' ? '🐯' : '🐐'}</Text>
            <Text style={styles.winTitle}>{state.winner === 'tiger' ? 'Tigers Win!' : 'Goats Win!'}</Text>
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
          </Animated.View>
        </View>
      )}
    </View>
  );
}

function ThinkingDots() {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    const loops = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.delay((2 - i) * 150),
        ])
      )
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.thinkingDots}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={[styles.thinkingDot, { opacity: dot }]} />
      ))}
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
  if (aiThinking) return `${side} (AI) thinking`;
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 15,
  },
  iconButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  iconButtonText: {
    color: theme.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  iconGlyph: {
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
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
    minWidth: 100,
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
  turnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    height: 22,
  },
  turnLabel: {
    color: theme.text,
    fontWeight: '700',
    fontSize: 16,
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.gold,
  },
  captureFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: theme.captureHighlight,
    borderRadius: 14,
  },
  hintButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: theme.card,
  },
  hintButtonDisabled: {
    opacity: 0.35,
  },
  hintButtonText: {
    color: theme.gold,
    fontWeight: '700',
    fontSize: 13,
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
