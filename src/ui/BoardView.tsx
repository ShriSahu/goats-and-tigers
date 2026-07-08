import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { NUM_POINTS } from '../game/board';
import { Cell, PointId } from '../game/types';
import { boardEdges, pointToPixel } from './boardLayout';
import { theme } from './theme';

const PADDING = 28;
const PIECE_SIZE = 34;

interface BoardViewProps {
  board: Cell[];
  size: number;
  selected: PointId | null;
  destinations: Set<PointId>;
  captureDestinations: Set<PointId>;
  onPointPress: (id: PointId) => void;
  disabled?: boolean;
}

export function BoardView({
  board,
  size,
  selected,
  destinations,
  captureDestinations,
  onPointPress,
  disabled,
}: BoardViewProps) {
  const edges = boardEdges();

  return (
    <View style={[styles.board, { width: size, height: size, backgroundColor: theme.boardWood }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {edges.map((edge) => {
          const a = pointToPixel(edge.from, size, PADDING);
          const b = pointToPixel(edge.to, size, PADDING);
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
          const p = pointToPixel(id, size, PADDING);
          return <Circle key={id} cx={p.x} cy={p.y} r={4} fill={theme.line} />;
        })}
      </Svg>

      {Array.from({ length: NUM_POINTS }, (_, id) => {
        const cell = board[id];
        const p = pointToPixel(id, size, PADDING);
        const isSelected = selected === id;
        const isDestination = destinations.has(id);
        const isCapture = captureDestinations.has(id);

        return (
          <Pressable
            key={id}
            disabled={disabled}
            onPress={() => onPointPress(id)}
            style={[
              styles.point,
              {
                left: p.x - PIECE_SIZE / 2,
                top: p.y - PIECE_SIZE / 2,
                width: PIECE_SIZE,
                height: PIECE_SIZE,
                borderRadius: PIECE_SIZE / 2,
              },
              isSelected && styles.pointSelected,
              isCapture && styles.pointCapture,
              !isCapture && isDestination && styles.pointDestination,
            ]}
            testID={`point-${id}`}
            hitSlop={6}
          >
            {cell === 'tiger' && <PieceLabel emoji="🐯" background={theme.tigerBg} />}
            {cell === 'goat' && <PieceLabel emoji="🐐" background={theme.goatBg} />}
          </Pressable>
        );
      })}
    </View>
  );
}

function PieceLabel({ emoji, background }: { emoji: string; background: string }) {
  return (
    <View style={[styles.piece, { backgroundColor: background }]}>
      <Text style={styles.pieceEmoji}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderRadius: 12,
    borderWidth: 3,
    borderColor: theme.boardWoodDark,
    overflow: 'hidden',
  },
  point: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointSelected: {
    borderWidth: 3,
    borderColor: theme.selected,
  },
  pointDestination: {
    borderWidth: 3,
    borderColor: theme.pointHighlight,
    backgroundColor: 'rgba(255, 209, 102, 0.35)',
  },
  pointCapture: {
    borderWidth: 3,
    borderColor: theme.captureHighlight,
    backgroundColor: 'rgba(239, 71, 111, 0.35)',
  },
  piece: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  pieceEmoji: {
    fontSize: 18,
  },
});
