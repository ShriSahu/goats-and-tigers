export type Side = 'tiger' | 'goat';

export type Cell = 'empty' | 'tiger' | 'goat';

export type Phase = 'placement' | 'movement';

export type PointId = number;

export interface Point {
  id: PointId;
  row: number;
  col: number;
}

export const TOTAL_GOATS = 20;
export const TOTAL_TIGERS = 4;
export const GOATS_CAPTURED_TO_WIN = 5;

export interface PlacementMove {
  kind: 'place';
  to: PointId;
}

export interface StepMove {
  kind: 'step';
  from: PointId;
  to: PointId;
}

export interface CaptureMove {
  kind: 'capture';
  from: PointId;
  to: PointId;
  captured: PointId;
}

export type Move = PlacementMove | StepMove | CaptureMove;

export interface GameState {
  board: Cell[];
  turn: Side;
  phase: Phase;
  goatsToPlace: number;
  goatsCaptured: number;
  winner: Side | null;
  lastMove: Move | null;
  moveHistory: Move[];
}

export type Difficulty = 'easy' | 'medium' | 'hard';
