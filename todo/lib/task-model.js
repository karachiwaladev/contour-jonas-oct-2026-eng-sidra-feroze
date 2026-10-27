/** Task field parsing and normalization (pure). */

const CONTROL = /[\u0000-\u001F\u007F]/g;

function sanitizeText(value, max) {
  return String(value || "")
    .replace(CONTROL, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, max);
}

export function parseTags(value) {
  const seen = new Set();
  const tags = [];
  const raw = Array.isArray(value)
    ? value.filter((item) => typeof item === "string").join(",")
    : String(value || "");
  for (const part of raw.split(",")) {
    const tag = sanitizeText(part, 40);
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length === 8) break;
  }
  return tags;
}

export function parseDue(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

export function parseRepeat(value) {
  return value === "daily" ? "daily" : "";
}

export function taskTags(task) {
  return parseTags(Array.isArray(task && task.tags) ? task.tags : []);
}

export function normalizeTitle(value) {
  return sanitizeText(value, 200);
}

export function sanitizeTask(task) {
  const row = task && typeof task === "object" ? task : {};
  return {
    ...row,
    title: normalizeTitle(row.title),
    tags: parseTags(row.tags),
    due: parseDue(row.due),
    repeat: parseRepeat(row.repeat),
    priority: ["high", "medium", "low"].includes(row.priority) ? row.priority : "medium",
    done: Boolean(row.done),
  };
}
