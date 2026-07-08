import { ADJACENCY, BOARD_SIZE, NUM_POINTS, POINTS } from '../game/board';
import { PointId } from '../game/types';

export interface PixelPoint {
  x: number;
  y: number;
}

export function pointToPixel(id: PointId, boardPx: number, padding: number): PixelPoint {
  const point = POINTS[id];
  const usable = boardPx - padding * 2;
  return {
    x: padding + (point.col / (BOARD_SIZE - 1)) * usable,
    y: padding + (point.row / (BOARD_SIZE - 1)) * usable,
  };
}

export interface Edge {
  from: PointId;
  to: PointId;
}

export function boardEdges(): Edge[] {
  const edges: Edge[] = [];
  for (let a = 0; a < NUM_POINTS; a++) {
    for (const b of ADJACENCY[a]) {
      if (b > a) edges.push({ from: a, to: b });
    }
  }
  return edges;
}
