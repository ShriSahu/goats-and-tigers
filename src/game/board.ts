import { Point, PointId } from './types';

export const BOARD_SIZE = 5;

/**
 * Bagh Chal is played on the 5x5 "Alquerque" point-grid: every horizontal and
 * vertical neighbor is connected, and diagonals exist only inside cells where
 * (cellRow + cellCol) is even. That checkerboard rule is what produces the
 * traditional board's star/triangle pattern instead of a full X grid.
 */
function buildPoints(): Point[] {
  const points: Point[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      points.push({ id: row * BOARD_SIZE + col, row, col });
    }
  }
  return points;
}

function buildAdjacency(): PointId[][] {
  const adjacency: PointId[][] = Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => []);
  const idOf = (row: number, col: number) => row * BOARD_SIZE + col;
  const connect = (a: PointId, b: PointId) => {
    if (!adjacency[a].includes(b)) adjacency[a].push(b);
    if (!adjacency[b].includes(a)) adjacency[b].push(a);
  };

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (col + 1 < BOARD_SIZE) connect(idOf(row, col), idOf(row, col + 1));
      if (row + 1 < BOARD_SIZE) connect(idOf(row, col), idOf(row + 1, col));
    }
  }

  for (let row = 0; row < BOARD_SIZE - 1; row++) {
    for (let col = 0; col < BOARD_SIZE - 1; col++) {
      if ((row + col) % 2 === 0) {
        connect(idOf(row, col), idOf(row + 1, col + 1));
        connect(idOf(row, col + 1), idOf(row + 1, col));
      }
    }
  }

  return adjacency;
}

export const POINTS: Point[] = buildPoints();
export const ADJACENCY: PointId[][] = buildAdjacency();
export const NUM_POINTS = POINTS.length;

export const TIGER_START_POINTS: PointId[] = [
  0, // (0,0) top-left
  4, // (0,4) top-right
  20, // (4,0) bottom-left
  24, // (4,4) bottom-right
];

export function pointAt(row: number, col: number): PointId {
  return row * BOARD_SIZE + col;
}

export function isAdjacent(a: PointId, b: PointId): boolean {
  return ADJACENCY[a].includes(b);
}

/**
 * Returns the landing point for a tiger jumping over `over` starting at
 * `from`, or null if `over` is not the midpoint of a straight board line
 * from `from` (i.e. there is no valid jump in that direction).
 */
export function jumpLanding(from: PointId, over: PointId): PointId | null {
  const a = POINTS[from];
  const b = POINTS[over];
  const landingRow = b.row + (b.row - a.row);
  const landingCol = b.col + (b.col - a.col);
  if (landingRow < 0 || landingRow >= BOARD_SIZE || landingCol < 0 || landingCol >= BOARD_SIZE) {
    return null;
  }
  const landing = pointAt(landingRow, landingCol);
  if (!isAdjacent(over, landing)) return null;
  return landing;
}
