/** Pure open/done tallies (no DOM / IndexedDB). */

export function countOpenDone(tasks) {
  if (!Array.isArray(tasks)) return { open: 0, done: 0 };
  let open = 0;
  let done = 0;
  for (const task of tasks) {
    if (task && task.done) done += 1;
    else open += 1;
  }
  return { open, done };
}

export function formatTaskCounts(counts) {
  return `${counts.open} open · ${counts.done} done`;
}
