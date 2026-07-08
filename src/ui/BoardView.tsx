import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { NUM_POINTS } from '../game/board';
import { Cell, Move, PointId } from '../game/types';
import { boardEdges, PixelPoint, pointToPixel } from './boardLayout';
import { PieceVisual } from './PieceVisual';
import { theme } from './theme';

const PADDING = 30;
const PIECE_SIZE = 36;
const HIT_SIZE = 40;
const PARTICLE_ANGLES = [0, 60, 120, 180, 240, 300];

export interface HintMove {
  from: PointId | null;
  to: PointId;
}

interface BoardViewProps {
  board: Cell[];
  size: number;
  selected: PointId | null;
  destinations: Set<PointId>;
  captureDestinations: Set<PointId>;
  onPointPress: (id: PointId) => void;
  disabled?: boolean;
  lastMove: Move | null;
  moveNumber: number;
  hint?: HintMove | null;
}

interface AnimatingMove {
  kind: Move['kind'];
  side: Cell;
  from: PointId | null;
  to: PointId;
  captured: PointId | null;
}

export function BoardView({
  board,
  size,
  selected,
  destinations,
  captureDestinations,
  onPointPress,
  disabled,
  lastMove,
  moveNumber,
  hint = null,
}: BoardViewProps) {
  const edges = useMemo(() => boardEdges(), []);
  const progress = useRef(new Animated.Value(1)).current;
  const [animatingMove, setAnimatingMove] = useState<AnimatingMove | null>(null);
  const lastMoveNumberRef = useRef(moveNumber);

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    if (moveNumber === lastMoveNumberRef.current) return;
    lastMoveNumberRef.current = moveNumber;
    if (!lastMove) return;

    const side: Cell = lastMove.kind === 'place' ? 'goat' : (board[lastMove.to] as Cell);
    const anim: AnimatingMove = {
      kind: lastMove.kind,
      side,
      from: lastMove.kind === 'place' ? null : lastMove.from,
      to: lastMove.to,
      captured: lastMove.kind === 'capture' ? lastMove.captured : null,
    };
    setAnimatingMove(anim);
    progress.setValue(0);
    const duration = lastMove.kind === 'capture' ? 520 : lastMove.kind === 'place' ? 380 : 300;
    Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setAnimatingMove(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveNumber]);

  const px = (id: PointId) => pointToPixel(id, size, PADDING);
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.18] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <View style={[styles.board, { width: size, height: size, backgroundColor: theme.boardWood }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {edges.map((edge) => {
          const a = px(edge.from);
          const b = px(edge.to);
          return (
            <Line
              key={`${edge.from}-${edge.to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={theme.line}
              strokeWidth={2.5}
            />
          );
        })}
        {Array.from({ length: NUM_POINTS }, (_, id) => {
          const p = px(id);
          return <Circle key={id} cx={p.x} cy={p.y} r={4} fill={theme.lineLight} />;
        })}
      </Svg>

      {Array.from({ length: NUM_POINTS }, (_, id) => {
        const cell = board[id];
        const p = px(id);
        const isSelected = selected === id;
        const isDestination = destinations.has(id);
        const isCapture = captureDestinations.has(id);
        const isHintTo = hint?.to === id;
        const isHintFrom = hint?.from === id;
        const suppressPiece = animatingMove !== null && animatingMove.to === id;

        return (
          <Pressable
            key={id}
            disabled={disabled}
            onPress={() => onPointPress(id)}
            style={[
              styles.point,
              {
                left: p.x - HIT_SIZE / 2,
                top: p.y - HIT_SIZE / 2,
                width: HIT_SIZE,
                height: HIT_SIZE,
                borderRadius: HIT_SIZE / 2,
              },
            ]}
            testID={`point-${id}`}
            hitSlop={6}
          >
            {isSelected && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.ring,
                  { borderColor: theme.selected, transform: [{ scale: pulseScale }], opacity: pulseOpacity },
                ]}
              />
            )}
            {(isHintFrom || isHintTo) && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.ring,
                  {
                    borderColor: theme.hint,
                    borderStyle: isHintFrom ? 'dashed' : 'solid',
                    transform: [{ scale: pulseScale }],
                    opacity: pulseOpacity,
                  },
                ]}
              />
            )}
            {!suppressPiece && cell !== 'empty' && (
              <View style={styles.piece} pointerEvents="none">
                <PieceVisual side={cell === 'tiger' ? 'tiger' : 'goat'} size={PIECE_SIZE} />
              </View>
            )}
            {cell === 'empty' && (isDestination || isCapture) && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.dot,
                  {
                    backgroundColor: isCapture ? theme.captureHighlight : theme.pointHighlight,
                    transform: [{ scale: pulseScale }],
                    opacity: pulseOpacity,
                  },
                ]}
              />
            )}
          </Pressable>
        );
      })}

      {animatingMove && typeof animatingMove.captured === 'number' && (
        <CapturedPop point={px(animatingMove.captured)} progress={progress} />
      )}

      {animatingMove && (
        <MovingPiece
          animatingMove={animatingMove}
          from={animatingMove.from !== null ? px(animatingMove.from) : px(animatingMove.to)}
          to={px(animatingMove.to)}
          progress={progress}
        />
      )}
    </View>
  );
}

function CapturedPop({ point, progress }: { point: PixelPoint; progress: Animated.Value }) {
  const opacity = progress.interpolate({ inputRange: [0, 0.55, 1], outputRange: [1, 1, 0] });
  const scale = progress.interpolate({ inputRange: [0, 0.55, 1], outputRange: [1, 1.3, 0.3] });

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: point.x - PIECE_SIZE / 2,
        top: point.y - PIECE_SIZE / 2,
        width: PIECE_SIZE,
        height: PIECE_SIZE,
      }}
    >
      <Animated.View style={{ width: '100%', height: '100%', opacity, transform: [{ scale }] }}>
        <PieceVisual side="goat" size={PIECE_SIZE} />
      </Animated.View>
      {PARTICLE_ANGLES.map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const dx = Math.cos(rad) * 22;
        const dy = Math.sin(rad) * 22;
        const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
        const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
        const particleOpacity = progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] });
        return (
          <Animated.View
            key={angle}
            style={{
              position: 'absolute',
              left: PIECE_SIZE / 2 - 3,
              top: PIECE_SIZE / 2 - 3,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: theme.captureHighlight,
              opacity: particleOpacity,
              transform: [{ translateX }, { translateY }],
            }}
          />
        );
      })}
    </View>
  );
}

function MovingPiece({
  animatingMove,
  from,
  to,
  progress,
}: {
  animatingMove: AnimatingMove;
  from: PixelPoint;
  to: PixelPoint;
  progress: Animated.Value;
}) {
  const isPlace = animatingMove.kind === 'place';
  const isJump = animatingMove.kind === 'capture';

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [from.x - to.x, 0] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [from.y - to.y, 0] });
  const hop = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, isJump ? -26 : -6, 0] });

  const scale = isPlace
    ? progress.interpolate({ inputRange: [0, 0.55, 0.8, 1], outputRange: [0.2, 1.18, 0.92, 1] })
    : progress.interpolate({ inputRange: [0, 0.75, 0.88, 1], outputRange: [1, 1, 1.16, 1] });

  const opacity = isPlace
    ? progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 1] })
    : 1;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: to.x - PIECE_SIZE / 2,
        top: to.y - PIECE_SIZE / 2,
        width: PIECE_SIZE,
        height: PIECE_SIZE,
        opacity,
        transform: [{ translateX }, { translateY: Animated.add(translateY, hop) }, { scale }],
      }}
    >
      <PieceVisual side={animatingMove.side === 'tiger' ? 'tiger' : 'goat'} size={PIECE_SIZE} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderRadius: 14,
    borderWidth: 4,
    borderColor: theme.boardWoodDark,
    overflow: 'hidden',
  },
  point: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 3,
  },
  piece: {
    width: PIECE_SIZE,
    height: PIECE_SIZE,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});
