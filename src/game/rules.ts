import { ADJACENCY, jumpLanding, NUM_POINTS, TIGER_START_POINTS } from './board';
import {
  Cell,
  CaptureMove,
  GameState,
  GOATS_CAPTURED_TO_WIN,
  Move,
  PointId,
  Side,
  StepMove,
  TOTAL_GOATS,
} from './types';

export function createInitialState(): GameState {
  const board: Cell[] = Array.from({ length: NUM_POINTS }, () => 'empty');
  for (const p of TIGER_START_POINTS) board[p] = 'tiger';
  return {
    board,
    turn: 'goat',
    phase: 'placement',
    goatsToPlace: TOTAL_GOATS,
    goatsCaptured: 0,
    winner: null,
    lastMove: null,
    moveHistory: [],
  };
}

function tigerCapturesFrom(board: Cell[], from: PointId): CaptureMove[] {
  const moves: CaptureMove[] = [];
  for (const neighbor of ADJACENCY[from]) {
    if (board[neighbor] !== 'goat') continue;
    const landing = jumpLanding(from, neighbor);
    if (landing !== null && board[landing] === 'empty') {
      moves.push({ kind: 'capture', from, to: landing, captured: neighbor });
    }
  }
  return moves;
}

function tigerStepsFrom(board: Cell[], from: PointId): StepMove[] {
  const moves: StepMove[] = [];
  for (const neighbor of ADJACENCY[from]) {
    if (board[neighbor] === 'empty') {
      moves.push({ kind: 'step', from, to: neighbor });
    }
  }
  return moves;
}

function goatStepsFrom(board: Cell[], from: PointId): StepMove[] {
  const moves: StepMove[] = [];
  for (const neighbor of ADJACENCY[from]) {
    if (board[neighbor] === 'empty') {
      moves.push({ kind: 'step', from, to: neighbor });
    }
  }
  return moves;
}

/** All legal moves for the side to move, ignoring whose turn it actually is. */
export function legalMovesForSide(state: GameState, side: Side): Move[] {
  const { board } = state;
  const moves: Move[] = [];

  if (side === 'goat') {
    if (state.phase === 'placement') {
      for (let p = 0; p < NUM_POINTS; p++) {
        if (board[p] === 'empty') moves.push({ kind: 'place', to: p });
      }
      return moves;
    }
    for (let p = 0; p < NUM_POINTS; p++) {
      if (board[p] === 'goat') moves.push(...goatStepsFrom(board, p));
    }
    return moves;
  }

  for (let p = 0; p < NUM_POINTS; p++) {
    if (board[p] === 'tiger') {
      moves.push(...tigerCapturesFrom(board, p));
      moves.push(...tigerStepsFrom(board, p));
    }
  }
  return moves;
}

export function legalMoves(state: GameState): Move[] {
  if (state.winner) return [];
  return legalMovesForSide(state, state.turn);
}

export function tigersHaveAnyMove(state: GameState): boolean {
  return legalMovesForSide(state, 'tiger').length > 0;
}

function movesEqual(a: Move, b: Move): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'place' && b.kind === 'place') return a.to === b.to;
  if (a.kind === 'step' && b.kind === 'step') return a.from === b.from && a.to === b.to;
  if (a.kind === 'capture' && b.kind === 'capture') {
    return a.from === b.from && a.to === b.to && a.captured === b.captured;
  }
  return false;
}

export function isLegalMove(state: GameState, move: Move): boolean {
  return legalMoves(state).some((m) => movesEqual(m, move));
}

/** Applies a move, returning a brand-new state. Throws if the move is illegal. */
export function applyMove(state: GameState, move: Move): GameState {
  if (state.winner) {
    throw new Error('Cannot move: game already has a winner');
  }
  if (!isLegalMove(state, move)) {
    throw new Error(`Illegal move: ${JSON.stringify(move)}`);
  }

  const board = state.board.slice();
  let goatsToPlace = state.goatsToPlace;
  let goatsCaptured = state.goatsCaptured;

  if (move.kind === 'place') {
    board[move.to] = 'goat';
    goatsToPlace -= 1;
  } else if (move.kind === 'step') {
    const piece = board[move.from];
    board[move.from] = 'empty';
    board[move.to] = piece;
  } else {
    board[move.from] = 'empty';
    board[move.captured] = 'empty';
    board[move.to] = 'tiger';
    goatsCaptured += 1;
  }

  const phase = goatsToPlace <= 0 ? 'movement' : 'placement';
  const nextTurn: Side = state.turn === 'goat' ? 'tiger' : 'goat';

  let nextState: GameState = {
    board,
    turn: nextTurn,
    phase,
    goatsToPlace,
    goatsCaptured,
    winner: null,
    lastMove: move,
    moveHistory: [...state.moveHistory, move],
  };

  nextState = { ...nextState, winner: computeWinner(nextState) };
  return nextState;
}

function computeWinner(state: GameState): Side | null {
  if (state.goatsCaptured >= GOATS_CAPTURED_TO_WIN) return 'tiger';
  if (!tigersHaveAnyMove(state)) return 'goat';
  return null;
}

export function countPieces(board: Cell[], side: Side): number {
  const target: Cell = side === 'tiger' ? 'tiger' : 'goat';
  return board.reduce((acc, cell) => acc + (cell === target ? 1 : 0), 0);
}
