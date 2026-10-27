import test from "node:test";
import assert from "node:assert/strict";
import { countOpenDone, formatTaskCounts } from "../lib/counts.js";

test("countOpenDone tallies done vs not done", () => {
  const counts = countOpenDone([
    { id: 1, done: false },
    { id: 2, done: true },
    { id: 3, done: false },
  ]);
  assert.deepEqual(counts, { open: 2, done: 1 });
});

test("countOpenDone treats missing done as open", () => {
  assert.deepEqual(countOpenDone([{ id: 1 }]), { open: 1, done: 0 });
});

test("countOpenDone uses the full list, not a filtered subset", () => {
  const all = [
    { id: 1, done: false },
    { id: 2, done: true },
    { id: 3, done: true },
  ];
  const filteredOpenOnly = all.filter((task) => !task.done);
  assert.deepEqual(countOpenDone(all), { open: 1, done: 2 });
  assert.notDeepEqual(countOpenDone(all), countOpenDone(filteredOpenOnly));
});

test("countOpenDone is empty for missing or non-array input", () => {
  assert.deepEqual(countOpenDone(), { open: 0, done: 0 });
  assert.deepEqual(countOpenDone(null), { open: 0, done: 0 });
  assert.deepEqual(countOpenDone("nope"), { open: 0, done: 0 });
});

test("formatTaskCounts renders open and done", () => {
  assert.equal(formatTaskCounts({ open: 2, done: 1 }), "2 open · 1 done");
  assert.equal(formatTaskCounts({ open: 0, done: 0 }), "0 open · 0 done");
});
