/** Pure priority helpers (no DOM / IndexedDB). */

const LEVELS = ["high", "medium", "low"];
const RANK = { high: 0, medium: 1, low: 2 };

export function parsePriority(value) {
  const key = String(value || "").trim().toLowerCase();
  return LEVELS.includes(key) ? key : "medium";
}

export function taskPriority(task) {
  return parsePriority(task && task.priority);
}

export function comparePriority(a, b) {
  const rankDiff = RANK[taskPriority(a)] - RANK[taskPriority(b)];
  if (rankDiff !== 0) return rankDiff;
  return (a.id || 0) - (b.id || 0);
}

export function matchesPriorityFilter(task, filter) {
  const selected = String(filter || "").trim().toLowerCase();
  if (!selected || selected === "all") return true;
  return taskPriority(task) === parsePriority(selected);
}
