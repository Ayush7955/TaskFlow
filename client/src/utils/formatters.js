import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * Parse a value into a Date object safely.
 * @param {string|number|Date} date
 * @returns {Date|null}
 */
const toDate = (date) => {
  if (!date) return null;
  if (date instanceof Date) return isValid(date) ? date : null;
  if (typeof date === 'string') {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : null;
  }
  if (typeof date === 'number') {
    const d = new Date(date);
    return isValid(d) ? d : null;
  }
  return null;
};

/**
 * Format a date into a readable string.
 * @param {string|number|Date} date
 * @param {string} [pattern='MMM d, yyyy'] — date-fns format pattern
 * @returns {string}
 */
export const formatDate = (date, pattern = 'MMM d, yyyy') => {
  const d = toDate(date);
  if (!d) return '';
  return format(d, pattern);
};

/**
 * Format a date as a relative time string, e.g. "2 hours ago".
 * @param {string|number|Date} date
 * @returns {string}
 */
export const formatRelative = (date) => {
  const d = toDate(date);
  if (!d) return '';
  return formatDistanceToNow(d, { addSuffix: true });
};

/**
 * Truncate a string to the given length, adding an ellipsis if needed.
 * @param {string} str
 * @param {number} [len=50]
 * @returns {string}
 */
export const truncate = (str, len = 50) => {
  if (!str) return '';
  if (str.length <= len) return str;
  return `${str.slice(0, len).trimEnd()}…`;
};

/**
 * Get initials from a full name (first letter of first + last word).
 * @param {string} name
 * @returns {string}
 */
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Map a numeric priority (1–4) to a human-readable label.
 * @param {number} priority
 * @returns {string}
 */
export const priorityLabel = (priority) => {
  const labels = {
    1: 'Critical',
    2: 'High',
    3: 'Medium',
    4: 'Low',
  };
  return labels[priority] || 'None';
};

/**
 * Map a numeric priority (1–4) to Tailwind class strings.
 * Uses stone/ink palette only — no bright/saturated colors.
 * @param {number} priority
 * @returns {string} — Tailwind classes for text + bg
 */
export const priorityColor = (priority) => {
  const colors = {
    1: 'bg-ink text-canvas',
    2: 'bg-stone-700 text-stone-100',
    3: 'bg-stone-300 text-stone-800',
    4: 'bg-stone-100 text-stone-500',
  };
  return colors[priority] || 'bg-stone-100 text-stone-400';
};
