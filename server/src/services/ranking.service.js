'use strict';

/**
 * Float-rank ordering engine for lists, cards, and checklist items.
 *
 * Uses floating-point position values with a gap of 1000 between items.
 * When gap < MIN_GAP, triggers a rebalance to redistribute positions evenly.
 *
 * Position algebra:
 *   - Append:    pos = last.position + GAP
 *   - Prepend:   pos = first.position / 2
 *   - Between:   pos = (prev.position + next.position) / 2
 *   - Rebalance: redistribute to [1000, 2000, 3000, ...] if any gap < MIN_GAP
 */

const GAP = 1000.0;
const MIN_GAP = 0.001; // Trigger rebalance when gap drops below this

/**
 * Calculate position to insert between two positions.
 * Returns midpoint; if null prev uses prepend, if null next uses append.
 */
function getBetween(prevPos, nextPos) {
  if (prevPos === null && nextPos === null) return GAP;
  if (prevPos === null) return nextPos / 2;
  if (nextPos === null) return prevPos + GAP;
  return (prevPos + nextPos) / 2;
}

/**
 * Calculate append position (after last element).
 * @param {number|null} lastPos - position of last element, or null if list is empty
 */
function getAppendPosition(lastPos) {
  return lastPos === null ? GAP : lastPos + GAP;
}

/**
 * Calculate prepend position (before first element).
 * @param {number|null} firstPos - position of first element, or null if list is empty
 */
function getPrependPosition(firstPos) {
  return firstPos === null ? GAP : firstPos / 2;
}

/**
 * Determine if rebalancing is needed for an array of sorted positions.
 * @param {number[]} positions - sorted array of current positions
 */
function needsRebalance(positions) {
  if (positions.length < 2) return false;
  for (let i = 1; i < positions.length; i++) {
    if (positions[i] - positions[i - 1] < MIN_GAP) return true;
  }
  return false;
}

/**
 * Generate rebalanced positions for n items.
 * @param {number} count - number of items to rebalance
 * @returns {number[]} new positions [1000, 2000, ..., count*1000]
 */
function generateRebalancedPositions(count) {
  return Array.from({ length: count }, (_, i) => (i + 1) * GAP);
}

/**
 * Rebalance list items in the DB.
 * @param {object} Model - Sequelize model (List, Card, or ChecklistItem)
 * @param {string} groupByField - e.g., 'board_id', 'list_id', 'checklist_id'
 * @param {number} groupId - the ID value to filter by
 * @param {object} [transaction] - Sequelize transaction
 */
async function rebalanceList(Model, groupByField, groupId, transaction) {
  const items = await Model.findAll({
    where: { [groupByField]: groupId, deleted_at: null },
    order: [['position', 'ASC']],
    transaction,
  });

  if (items.length === 0) return;

  const newPositions = generateRebalancedPositions(items.length);
  await Promise.all(
    items.map((item, idx) => {
      item.position = newPositions[idx];
      return item.save({ transaction });
    })
  );
}

/**
 * Calculate the new position for a drag-and-drop move operation.
 *
 * @param {object} options
 * @param {number|null} options.beforePosition - position of item immediately before drop target (null = dropped at start)
 * @param {number|null} options.afterPosition  - position of item immediately after drop target (null = dropped at end)
 * @returns {{ position: number, shouldRebalance: boolean }}
 */
function calculateMovePosition({ beforePosition, afterPosition }) {
  const position = getBetween(beforePosition, afterPosition);
  const gap = afterPosition !== null && beforePosition !== null
    ? afterPosition - beforePosition
    : GAP * 2;
  const shouldRebalance = gap < MIN_GAP * 10; // rebalance if gap < 0.01
  return { position, shouldRebalance };
}

module.exports = {
  GAP,
  MIN_GAP,
  getBetween,
  getAppendPosition,
  getPrependPosition,
  needsRebalance,
  generateRebalancedPositions,
  rebalanceList,
  calculateMovePosition,
};
