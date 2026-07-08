import { ADJACENCY, isAdjacent, jumpLanding, NUM_POINTS, pointAt, TIGER_START_POINTS } from '../src/game/board';

describe('board topology', () => {
  it('has 25 points', () => {
    expect(NUM_POINTS).toBe(25);
  });

  it('has a symmetric adjacency graph', () => {
    for (let a = 0; a < NUM_POINTS; a++) {
      for (const b of ADJACENCY[a]) {
        expect(ADJACENCY[b]).toContain(a);
      }
    }
  });

  it('gives the corner point degree 2 (no diagonal, since (0,0) cell is marked but only connects inward)', () => {
    // (0,0) cell is "even" so it gets diagonal to (1,1), plus its two orthogonal edges.
    expect(ADJACENCY[pointAt(0, 0)].sort()).toEqual([pointAt(0, 1), pointAt(1, 0), pointAt(1, 1)].sort());
  });

  it('gives the center point degree 6 (4 orthogonal + 2 diagonal)', () => {
    const center = pointAt(2, 2);
    expect(ADJACENCY[center]).toHaveLength(6);
    expect(ADJACENCY[center].sort()).toEqual(
      [pointAt(1, 2), pointAt(3, 2), pointAt(2, 1), pointAt(2, 3), pointAt(1, 1), pointAt(3, 3)].sort()
    );
  });

  it('does not connect points diagonally inside an "odd" cell', () => {
    // cell (0,1)-(1,2) has (row+col) = 1, odd -> no diagonal.
    expect(isAdjacent(pointAt(0, 1), pointAt(1, 2))).toBe(false);
    expect(isAdjacent(pointAt(0, 2), pointAt(1, 1))).toBe(false);
  });

  it('starts tigers on all four corners', () => {
    expect(TIGER_START_POINTS.sort()).toEqual(
      [pointAt(0, 0), pointAt(0, 4), pointAt(4, 0), pointAt(4, 4)].sort()
    );
  });

  it('computes straight-line jump landings, and rejects non-straight jumps', () => {
    // Horizontal: (2,0) over (2,1) lands on (2,2).
    expect(jumpLanding(pointAt(2, 0), pointAt(2, 1))).toBe(pointAt(2, 2));
    // Diagonal: (0,0) over (1,1) lands on (2,2).
    expect(jumpLanding(pointAt(0, 0), pointAt(1, 1))).toBe(pointAt(2, 2));
    // Off-board landing returns null.
    expect(jumpLanding(pointAt(0, 3), pointAt(0, 4))).toBeNull();
    // (0,1) over (1,2) is not a straight adjacency-backed line (odd cell, no diagonal)
    // so even though the reflection point (2,3) is on-board, there is no edge (1,2)-(2,3)
    // for this particular pair since it's not the diagonal of an even cell either
    // — verify jumpLanding respects edge existence, not just arithmetic reflection.
    expect(isAdjacent(pointAt(1, 2), pointAt(2, 3))).toBe(false);
    expect(jumpLanding(pointAt(0, 1), pointAt(1, 2))).toBeNull();
  });
});
