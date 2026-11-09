'use strict';

const {
  getBetween,
  getAppendPosition,
  getPrependPosition,
  needsRebalance,
  generateRebalancedPositions,
  calculateMovePosition,
  GAP,
} = require('../../src/services/ranking.service');

describe('Ranking Service — getBetween', () => {
  test('returns GAP when both null (empty list)', () => {
    expect(getBetween(null, null)).toBe(GAP);
  });

  test('prepend: returns half of first position', () => {
    expect(getBetween(null, 2000)).toBe(1000);
  });

  test('append: returns prev + GAP', () => {
    expect(getBetween(3000, null)).toBe(4000);
  });

  test('between: returns midpoint', () => {
    expect(getBetween(1000, 3000)).toBe(2000);
  });

  test('between close positions: returns precise midpoint', () => {
    expect(getBetween(1000, 1001)).toBe(1000.5);
  });

  test('very small gap: returns midpoint', () => {
    expect(getBetween(1000, 1000.002)).toBeCloseTo(1000.001);
  });
});

describe('Ranking Service — getAppendPosition', () => {
  test('returns GAP when list is empty', () => {
    expect(getAppendPosition(null)).toBe(GAP);
  });

  test('returns lastPos + GAP', () => {
    expect(getAppendPosition(5000)).toBe(6000);
  });
});

describe('Ranking Service — getPrependPosition', () => {
  test('returns GAP when list is empty', () => {
    expect(getPrependPosition(null)).toBe(GAP);
  });

  test('returns firstPos / 2', () => {
    expect(getPrependPosition(2000)).toBe(1000);
  });

  test('very small first position', () => {
    expect(getPrependPosition(0.002)).toBeCloseTo(0.001);
  });
});

describe('Ranking Service — needsRebalance', () => {
  test('returns false for empty array', () => {
    expect(needsRebalance([])).toBe(false);
  });

  test('returns false for single item', () => {
    expect(needsRebalance([1000])).toBe(false);
  });

  test('returns false when all gaps are large', () => {
    expect(needsRebalance([1000, 2000, 3000, 4000])).toBe(false);
  });

  test('returns true when gap is below MIN_GAP', () => {
    expect(needsRebalance([1000, 1000.0001])).toBe(true);
  });

  test('returns false when gap is exactly at MIN_GAP', () => {
    // MIN_GAP = 0.001, so 1000 and 1000.001 should be false
    expect(needsRebalance([1000, 1001])).toBe(false);
  });
});

describe('Ranking Service — generateRebalancedPositions', () => {
  test('generates positions for 1 item', () => {
    expect(generateRebalancedPositions(1)).toEqual([1000]);
  });

  test('generates positions for 5 items', () => {
    expect(generateRebalancedPositions(5)).toEqual([1000, 2000, 3000, 4000, 5000]);
  });

  test('generates positions for 0 items', () => {
    expect(generateRebalancedPositions(0)).toEqual([]);
  });
});

describe('Ranking Service — calculateMovePosition', () => {
  test('drop at beginning (no before)', () => {
    const { position } = calculateMovePosition({ beforePosition: null, afterPosition: 2000 });
    expect(position).toBe(1000); // 2000 / 2
  });

  test('drop at end (no after)', () => {
    const { position } = calculateMovePosition({ beforePosition: 5000, afterPosition: null });
    expect(position).toBe(6000);
  });

  test('drop between items', () => {
    const { position } = calculateMovePosition({ beforePosition: 2000, afterPosition: 4000 });
    expect(position).toBe(3000);
  });

  test('flags shouldRebalance when gap is tiny', () => {
    const { shouldRebalance } = calculateMovePosition({
      beforePosition: 1000,
      afterPosition: 1000.005,
    });
    expect(shouldRebalance).toBe(true);
  });

  test('no rebalance needed for normal gap', () => {
    const { shouldRebalance } = calculateMovePosition({
      beforePosition: 1000,
      afterPosition: 2000,
    });
    expect(shouldRebalance).toBe(false);
  });
});
