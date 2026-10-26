/** Task field parsing and normalization (pure). */

export function parseTags(value) {
  const seen = new Set();
  const tags = [];
  for (const part of String(value || "").split(",")) {
    const tag = part.trim().slice(0, 40);
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
  return Array.isArray(task.tags) ? task.tags.filter((tag) => typeof tag === "string") : [];
}

export function normalizeTitle(value) {
  const clean = String(value || "").trim().slice(0, 200);
  return clean;
}
