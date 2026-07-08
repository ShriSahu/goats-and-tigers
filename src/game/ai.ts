import { applyMove, legalMoves, legalMovesForSide } from './rules';
import { Difficulty, GameState, Move, Side } from './types';

const WIN_SCORE = 1_000_000;

function evaluate(state: GameState): number {
  if (state.winner === 'tiger') return WIN_SCORE;
  if (state.winner === 'goat') return -WIN_SCORE;

  const tigerMoves = legalMovesForSide(state, 'tiger');
  const goatMoves = legalMovesForSide(state, 'goat');
  const captureThreats = tigerMoves.filter((m) => m.kind === 'capture').length;

  let score = 0;
  score += state.goatsCaptured * 120;
  score += tigerMoves.length * 3;
  score -= goatMoves.length * 1;
  score += captureThreats * 25;

  return score;
}

function orderMoves(moves: Move[], side: Side): Move[] {
  return [...moves].sort((a, b) => {
    const rank = (m: Move) => {
      if (side === 'tiger' && m.kind === 'capture') return 0;
      if (m.kind === 'step' || m.kind === 'place') return 1;
      return 2;
    };
    return rank(a) - rank(b);
  });
}

function negamax(state: GameState, depth: number, alpha: number, beta: number, color: 1 | -1): number {
  if (depth === 0 || state.winner) {
    return color * evaluate(state);
  }

  const moves = legalMoves(state);
  if (moves.length === 0) {
    return color * evaluate(state);
  }

  const ordered = orderMoves(moves, state.turn);
  let best = -Infinity;
  for (const move of ordered) {
    const child = applyMove(state, move);
    const val = -negamax(child, depth - 1, -beta, -alpha, (-color) as 1 | -1);
    if (val > best) best = val;
    if (val > alpha) alpha = val;
    if (alpha >= beta) break;
  }
  return best;
}

const DEPTH_BY_DIFFICULTY: Record<Difficulty, number> = {
  easy: 0,
  medium: 2,
  hard: 3,
};

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Shuffles a copy of the array (Fisher-Yates) so equal-scoring moves vary between games. */
function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function chooseAiMove(state: GameState, difficulty: Difficulty): Move | null {
  const moves = legalMoves(state);
  if (moves.length === 0) return null;

  if (difficulty === 'easy') {
    // Slight capture bias so "easy" tigers still occasionally punish blunders.
    const captures = moves.filter((m) => m.kind === 'capture');
    if (state.turn === 'tiger' && captures.length > 0 && Math.random() < 0.5) {
      return pickRandom(captures);
    }
    return pickRandom(moves);
  }

  const depth = DEPTH_BY_DIFFICULTY[difficulty];
  const color: 1 | -1 = state.turn === 'tiger' ? 1 : -1;
  let bestMove: Move = moves[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (const move of shuffled(orderMoves(moves, state.turn))) {
    const child = applyMove(state, move);
    const val = -negamax(child, depth - 1, -beta, -alpha, (-color) as 1 | -1);
    if (val > bestScore) {
      bestScore = val;
      bestMove = move;
    }
    if (val > alpha) alpha = val;
  }

  return bestMove;
}
