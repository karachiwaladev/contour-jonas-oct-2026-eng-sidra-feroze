import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeTitle,
  parseDue,
  parseRepeat,
  parseTags,
  sanitizeTask,
  taskTags,
} from "../lib/task-model.js";

test("normalizeTitle strips control characters and markup brackets", () => {
  assert.equal(normalizeTitle("  Buy milk\u0000<script>  "), "Buy milkscript");
  assert.equal(normalizeTitle("a".repeat(300)).length, 200);
});

test("parseTags sanitizes and caps tags", () => {
  assert.deepEqual(parseTags("home, <img>, home"), ["home", "img"]);
  const many = Array.from({ length: 12 }, (_, i) => `t${i}`).join(",");
  assert.equal(parseTags(many).length, 8);
});

test("taskTags only keeps strings", () => {
  assert.deepEqual(taskTags({ tags: ["ok", 1, null] }), ["ok"]);
  assert.deepEqual(taskTags({}), []);
});

test("parseDue and parseRepeat are strict", () => {
  assert.equal(parseDue("2026-10-27"), "2026-10-27");
  assert.equal(parseDue("27/10/2026"), "");
  assert.equal(parseRepeat("daily"), "daily");
  assert.equal(parseRepeat("weekly"), "");
});

test("sanitizeTask cleans stored records", () => {
  const clean = sanitizeTask({
    title: "<b>Hi</b>",
    tags: ["<x>", "ok"],
    due: "nope",
    repeat: "weekly",
    priority: "urgent",
    done: true,
    id: 3,
  });
  assert.equal(clean.title, "bHi/b");
  assert.deepEqual(clean.tags, ["x", "ok"]);
  assert.equal(clean.due, "");
  assert.equal(clean.repeat, "");
  assert.equal(clean.priority, "medium");
  assert.equal(clean.done, true);
  assert.equal(clean.id, 3);
  const empty = sanitizeTask(null);
  assert.equal(empty.title, "");
  assert.deepEqual(empty.tags, []);
  assert.equal(empty.done, false);
});
