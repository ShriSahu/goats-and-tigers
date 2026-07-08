import { pointAt } from '../src/game/board';
import {
  applyMove,
  createInitialState,
  isLegalMove,
  legalMoves,
  legalMovesForSide,
} from '../src/game/rules';
import { Cell, GameState } from '../src/game/types';

function emptyBoard(): Cell[] {
  return Array.from({ length: 25 }, () => 'empty' as Cell);
}

function stateWith(overrides: Partial<GameState>): GameState {
  return { ...createInitialState(), board: emptyBoard(), ...overrides };
}

describe('initial state', () => {
  it('starts with 4 tigers on the corners, 20 goats to place, goat to move first', () => {
    const state = createInitialState();
    expect(state.turn).toBe('goat');
    expect(state.phase).toBe('placement');
    expect(state.goatsToPlace).toBe(20);
    expect(state.goatsCaptured).toBe(0);
    expect(state.winner).toBeNull();
    expect(state.board[pointAt(0, 0)]).toBe('tiger');
    expect(state.board[pointAt(0, 4)]).toBe('tiger');
    expect(state.board[pointAt(4, 0)]).toBe('tiger');
    expect(state.board[pointAt(4, 4)]).toBe('tiger');
    expect(state.board.filter((c) => c === 'tiger')).toHaveLength(4);
    expect(state.board.filter((c) => c === 'goat')).toHaveLength(0);
  });
});

describe('placement phase', () => {
  it('only allows goats to be placed on empty points, and only on the goat turn', () => {
    const state = createInitialState();
    const moves = legalMoves(state);
    expect(moves.every((m) => m.kind === 'place')).toBe(true);
    // 25 points minus 4 tiger-occupied corners = 21 empty placement spots.
    expect(moves).toHaveLength(21);
  });

  it('goats cannot step-move during placement phase even if goats exist on the board', () => {
    const board = emptyBoard();
    board[pointAt(0, 0)] = 'tiger';
    board[pointAt(2, 2)] = 'goat';
    const state = stateWith({ board, turn: 'goat', phase: 'placement', goatsToPlace: 19 });
    const moves = legalMovesForSide(state, 'goat');
    expect(moves.every((m) => m.kind === 'place')).toBe(true);
  });

  it('placing a goat decrements goatsToPlace and switches turn to tiger', () => {
    const state = createInitialState();
    const next = applyMove(state, { kind: 'place', to: pointAt(2, 2) });
    expect(next.goatsToPlace).toBe(19);
    expect(next.turn).toBe('tiger');
    expect(next.board[pointAt(2, 2)]).toBe('goat');
    expect(next.phase).toBe('placement');
  });

  it('transitions to movement phase once the 20th goat is placed', () => {
    let state = createInitialState();
    // Alternate goat placements with a harmless tiger shuffle so we can drive
    // goatsToPlace down to zero without worrying about captures. Re-derive the
    // empty points fresh each turn since tiger shuffles change the board.
    while (state.goatsToPlace > 0) {
      const emptyPoint = state.board.findIndex((c) => c === 'empty');
      state = applyMove(state, { kind: 'place', to: emptyPoint });
      if (state.winner) break;
      const tigerMoves = legalMovesForSide(state, 'tiger').filter((m) => m.kind === 'step');
      if (tigerMoves.length > 0) {
        state = applyMove(state, tigerMoves[0]);
      }
    }
    expect(state.goatsToPlace).toBe(0);
    expect(state.phase).toBe('movement');
  });
});

describe('movement phase', () => {
  it('allows a goat to step to an empty adjacent point, not a distant one', () => {
    const board = emptyBoard();
    board[pointAt(2, 2)] = 'goat';
    const state = stateWith({ board, turn: 'goat', phase: 'movement', goatsToPlace: 0 });
    const moves = legalMovesForSide(state, 'goat');
    expect(moves.every((m) => m.kind === 'step')).toBe(true);
    const targets = moves.map((m) => (m as { to: number }).to).sort();
    expect(targets).toEqual(
      [pointAt(1, 2), pointAt(3, 2), pointAt(2, 1), pointAt(2, 3), pointAt(1, 1), pointAt(3, 3)].sort()
    );
    expect(isLegalMove(state, { kind: 'step', from: pointAt(2, 2), to: pointAt(0, 0) })).toBe(false);
  });

  it('allows a tiger to step to any empty adjacent point', () => {
    const board = emptyBoard();
    board[pointAt(0, 0)] = 'tiger';
    const state = stateWith({ board, turn: 'tiger', phase: 'movement', goatsToPlace: 0 });
    const moves = legalMovesForSide(state, 'tiger');
    expect(moves.map((m) => (m as { to: number }).to).sort()).toEqual(
      [pointAt(0, 1), pointAt(1, 0), pointAt(1, 1)].sort()
    );
  });

  it('throws on an illegal move', () => {
    const state = createInitialState();
    expect(() => applyMove(state, { kind: 'step', from: pointAt(0, 0), to: pointAt(2, 2) })).toThrow();
  });
});

describe('tiger captures', () => {
  it('lets a tiger jump a straight line over an adjacent goat into an empty landing point', () => {
    const board = emptyBoard();
    board[pointAt(0, 0)] = 'tiger';
    board[pointAt(1, 1)] = 'goat';
    // (2,2) empty -> diagonal capture landing.
    const state = stateWith({ board, turn: 'tiger', phase: 'movement', goatsToPlace: 0 });
    const moves = legalMovesForSide(state, 'tiger');
    const capture = moves.find((m) => m.kind === 'capture');
    expect(capture).toEqual({ kind: 'capture', from: pointAt(0, 0), to: pointAt(2, 2), captured: pointAt(1, 1) });
  });

  it('does not allow a capture when the landing point is occupied', () => {
    const board = emptyBoard();
    board[pointAt(0, 0)] = 'tiger';
    board[pointAt(1, 1)] = 'goat';
    board[pointAt(2, 2)] = 'goat';
    const state = stateWith({ board, turn: 'tiger', phase: 'movement', goatsToPlace: 0 });
    const moves = legalMovesForSide(state, 'tiger');
    expect(moves.some((m) => m.kind === 'capture')).toBe(false);
  });

  it('does not allow a capture jump that is not a straight line', () => {
    const board = emptyBoard();
    board[pointAt(1, 2)] = 'tiger';
    board[pointAt(0, 1)] = 'goat'; // not adjacent to (1,2) at all in this topology
    const state = stateWith({ board, turn: 'tiger', phase: 'movement', goatsToPlace: 0 });
    const moves = legalMovesForSide(state, 'tiger');
    expect(moves.some((m) => m.kind === 'capture')).toBe(false);
  });

  it('applying a capture move removes the goat, moves the tiger, and increments goatsCaptured', () => {
    const board = emptyBoard();
    board[pointAt(0, 0)] = 'tiger';
    board[pointAt(1, 1)] = 'goat';
    const state = stateWith({ board, turn: 'tiger', phase: 'movement', goatsToPlace: 0 });
    const next = applyMove(state, { kind: 'capture', from: pointAt(0, 0), to: pointAt(2, 2), captured: pointAt(1, 1) });
    expect(next.board[pointAt(0, 0)]).toBe('empty');
    expect(next.board[pointAt(1, 1)]).toBe('empty');
    expect(next.board[pointAt(2, 2)]).toBe('tiger');
    expect(next.goatsCaptured).toBe(1);
    expect(next.turn).toBe('goat');
  });

  it('capturing is optional, not mandatory: a tiger may choose a plain step even if a capture is available', () => {
    const board = emptyBoard();
    board[pointAt(0, 0)] = 'tiger';
    board[pointAt(1, 1)] = 'goat';
    const state = stateWith({ board, turn: 'tiger', phase: 'movement', goatsToPlace: 0 });
    expect(isLegalMove(state, { kind: 'step', from: pointAt(0, 0), to: pointAt(0, 1) })).toBe(true);
  });
});

describe('win detection', () => {
  it('tiger wins once goatsCaptured reaches 5', () => {
    const board = emptyBoard();
    board[pointAt(0, 0)] = 'tiger';
    board[pointAt(1, 1)] = 'goat';
    const state = stateWith({ board, turn: 'tiger', phase: 'movement', goatsToPlace: 0, goatsCaptured: 4 });
    const next = applyMove(state, { kind: 'capture', from: pointAt(0, 0), to: pointAt(2, 2), captured: pointAt(1, 1) });
    expect(next.goatsCaptured).toBe(5);
    expect(next.winner).toBe('tiger');
  });

  it('does not declare a tiger win below the capture threshold', () => {
    const board = emptyBoard();
    board[pointAt(0, 0)] = 'tiger';
    board[pointAt(1, 1)] = 'goat';
    const state = stateWith({ board, turn: 'tiger', phase: 'movement', goatsToPlace: 0, goatsCaptured: 3 });
    const next = applyMove(state, { kind: 'capture', from: pointAt(0, 0), to: pointAt(2, 2), captured: pointAt(1, 1) });
    expect(next.goatsCaptured).toBe(4);
    expect(next.winner).toBeNull();
  });

  it('goats win when every tiger is completely blocked (no step and no capture)', () => {
    const board = emptyBoard();
    // Tiger in the corner (0,0), surrounded by goats on all its neighbors,
    // with no empty landing point behind any of them -> tiger fully blocked.
    board[pointAt(0, 0)] = 'tiger';
    board[pointAt(0, 1)] = 'goat';
    board[pointAt(1, 0)] = 'goat';
    board[pointAt(1, 1)] = 'goat';
    // Block every capture landing point too.
    board[pointAt(0, 2)] = 'goat'; // landing behind (0,1)
    board[pointAt(2, 0)] = 'goat'; // landing behind (1,0)
    board[pointAt(2, 2)] = 'goat'; // landing behind (1,1)
    // An unrelated free goat, far from the blockade, that has somewhere to step.
    board[pointAt(4, 4)] = 'goat';

    const state = stateWith({ board, turn: 'goat', phase: 'movement', goatsToPlace: 0 });
    const next = applyMove(state, { kind: 'step', from: pointAt(4, 4), to: pointAt(4, 3) });
    expect(next.winner).toBe('goat');
  });

  it('game has no legal moves once a winner is set', () => {
    const board = emptyBoard();
    board[pointAt(0, 0)] = 'tiger';
    board[pointAt(1, 1)] = 'goat';
    const state = stateWith({ board, turn: 'tiger', phase: 'movement', goatsToPlace: 0, goatsCaptured: 4 });
    const next = applyMove(state, { kind: 'capture', from: pointAt(0, 0), to: pointAt(2, 2), captured: pointAt(1, 1) });
    expect(legalMoves(next)).toHaveLength(0);
    expect(() => applyMove(next, { kind: 'place', to: 0 })).toThrow();
  });
});
