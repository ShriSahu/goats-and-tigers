import { useCallback, useEffect, useMemo, useState } from 'react';
import { chooseAiMove } from '../game/ai';
import { applyMove, createInitialState, legalMoves } from '../game/rules';
import { CaptureMove, Difficulty, GameState, Move, PointId, Side, StepMove } from '../game/types';

export interface HintMove {
  from: PointId | null;
  to: PointId;
}

export type GameMode =
  | { type: 'vsAI'; humanSide: Side; difficulty: Difficulty }
  | { type: 'passAndPlay' };

const AI_THINK_DELAY_MS = 450;

function isHumanTurn(mode: GameMode, state: GameState): boolean {
  if (mode.type === 'passAndPlay') return true;
  return state.turn === mode.humanSide;
}

export function useGameEngine(mode: GameMode) {
  const [state, setState] = useState<GameState>(createInitialState);
  const [selected, setSelected] = useState<PointId | null>(null);
  const [aiThinking, setAiThinking] = useState(false);

  const humanTurn = isHumanTurn(mode, state);

  useEffect(() => {
    if (state.winner) return;
    if (mode.type !== 'vsAI') return;
    if (state.turn === mode.humanSide) return;

    setAiThinking(true);
    const timer = setTimeout(() => {
      setState((current) => {
        if (current.winner || current.turn === mode.humanSide) return current;
        const move = chooseAiMove(current, mode.difficulty);
        if (!move) return current;
        return applyMove(current, move);
      });
      setAiThinking(false);
    }, AI_THINK_DELAY_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const movesFromSelected = useMemo<(StepMove | CaptureMove)[]>(() => {
    if (selected === null) return [];
    return legalMoves(state).filter(
      (m): m is StepMove | CaptureMove => m.kind !== 'place' && m.from === selected
    );
  }, [state, selected]);

  const destinations = useMemo(
    () => new Set(movesFromSelected.filter((m) => m.kind === 'step').map((m) => m.to)),
    [movesFromSelected]
  );
  const captureDestinations = useMemo(
    () => new Set(movesFromSelected.filter((m) => m.kind === 'capture').map((m) => m.to)),
    [movesFromSelected]
  );

  const ownPieceHasMoves = useCallback(
    (id: PointId) => legalMoves(state).some((m) => m.kind !== 'place' && m.from === id),
    [state]
  );

  const onPointPress = useCallback(
    (id: PointId) => {
      if (!humanTurn || state.winner || aiThinking) return;

      const side = state.turn;
      const cell = state.board[id];

      if (state.phase === 'placement' && side === 'goat') {
        const placeMove: Move = { kind: 'place', to: id };
        if (legalMoves(state).some((m) => m.kind === 'place' && m.to === id)) {
          setState((current) => applyMove(current, placeMove));
        }
        return;
      }

      const ownCell = side === 'tiger' ? 'tiger' : 'goat';

      if (selected === null) {
        if (cell === ownCell && ownPieceHasMoves(id)) {
          setSelected(id);
        }
        return;
      }

      if (id === selected) {
        setSelected(null);
        return;
      }

      const chosen = movesFromSelected.find((m) => m.to === id);
      if (chosen) {
        setState((current) => applyMove(current, chosen));
        setSelected(null);
        return;
      }

      if (cell === ownCell && ownPieceHasMoves(id)) {
        setSelected(id);
      } else {
        setSelected(null);
      }
    },
    [humanTurn, state, aiThinking, selected, movesFromSelected, ownPieceHasMoves]
  );

  const reset = useCallback(() => {
    setState(createInitialState());
    setSelected(null);
    setAiThinking(false);
  }, []);

  const getHint = useCallback((): HintMove | null => {
    if (!humanTurn || state.winner || aiThinking) return null;
    const move = chooseAiMove(state, 'hard');
    if (!move) return null;
    return { from: move.kind === 'place' ? null : move.from, to: move.to };
  }, [humanTurn, state, aiThinking]);

  return {
    state,
    selected,
    destinations,
    captureDestinations,
    onPointPress,
    reset,
    isHumanTurn: humanTurn,
    aiThinking,
    getHint,
  };
}
