import test from "node:test";
import assert from "node:assert/strict";
import {
  comparePriority,
  matchesPriorityFilter,
  parsePriority,
  taskPriority,
} from "../lib/priority.js";

test("parsePriority accepts high medium low", () => {
  assert.equal(parsePriority("high"), "high");
  assert.equal(parsePriority("MEDIUM"), "medium");
  assert.equal(parsePriority("low"), "low");
});

test("parsePriority defaults to medium", () => {
  assert.equal(parsePriority(""), "medium");
  assert.equal(parsePriority("urgent"), "medium");
  assert.equal(parsePriority(null), "medium");
});

test("taskPriority reads stored field with default", () => {
  assert.equal(taskPriority({ priority: "high" }), "high");
  assert.equal(taskPriority({}), "medium");
});

test("comparePriority sorts high then medium then low, then id", () => {
  const tasks = [
    { id: 2, priority: "low" },
    { id: 1, priority: "high" },
    { id: 4, priority: "medium" },
    { id: 3, priority: "high" },
  ];
  const ordered = [...tasks].sort(comparePriority).map((t) => t.id);
  assert.deepEqual(ordered, [1, 3, 4, 2]);
});

test("matchesPriorityFilter", () => {
  assert.equal(matchesPriorityFilter({ priority: "high" }, ""), true);
  assert.equal(matchesPriorityFilter({ priority: "high" }, "all"), true);
  assert.equal(matchesPriorityFilter({ priority: "high" }, "high"), true);
  assert.equal(matchesPriorityFilter({ priority: "low" }, "high"), false);
  assert.equal(matchesPriorityFilter({}, "medium"), true);
});
