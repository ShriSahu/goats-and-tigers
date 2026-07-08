import { pointAt } from '../src/game/board';
import { chooseAiMove } from '../src/game/ai';
import { createInitialState } from '../src/game/rules';
import { Cell, GameState } from '../src/game/types';

describe('AI', () => {
  it('returns a legal placement move for goat at the start of the game, at every difficulty', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const state = createInitialState();
      const move = chooseAiMove(state, difficulty);
      expect(move).not.toBeNull();
      expect(move!.kind).toBe('place');
    }
  });

  it('returns null when there are no legal moves (terminal state)', () => {
    const state = createInitialState();
    const terminal: GameState = { ...state, winner: 'tiger' };
    expect(chooseAiMove(terminal, 'easy')).toBeNull();
  });

  it('medium/hard AI prefers an immediate capture over an equal-looking quiet move when available', () => {
    const board: Cell[] = Array.from({ length: 25 }, () => 'empty');
    board[pointAt(0, 0)] = 'tiger';
    board[pointAt(1, 1)] = 'goat';
    const state: GameState = {
      board,
      turn: 'tiger',
      phase: 'movement',
      goatsToPlace: 0,
      goatsCaptured: 0,
      winner: null,
      lastMove: null,
      moveHistory: [],
    };
    const move = chooseAiMove(state, 'hard');
    expect(move).toEqual({ kind: 'capture', from: pointAt(0, 0), to: pointAt(2, 2), captured: pointAt(1, 1) });
  });
});
