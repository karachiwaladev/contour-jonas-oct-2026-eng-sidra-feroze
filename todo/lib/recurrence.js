/** Pure recurrence helpers (no DOM / IndexedDB). */

export function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysISO(iso, days) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatDateISO(date);
}

/** After user completes a daily recurring task: reset incomplete and roll due date. */
export function applyDailyComplete(task, todayISO) {
  const baseDue = task.due && /^\d{4}-\d{2}-\d{2}$/.test(task.due) ? task.due : todayISO;
  const nextDue = addDaysISO(baseDue, 1);
  return { ...task, done: false, due: nextDue || task.due };
}

export function isDailySeries(task) {
  return Boolean(task && task.repeat === "daily");
}
