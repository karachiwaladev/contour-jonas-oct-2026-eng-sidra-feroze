import test from "node:test";
import assert from "node:assert/strict";
import { addDaysISO, applyDailyComplete, isDailySeries } from "../lib/recurrence.js";

test("addDaysISO rolls calendar days", () => {
  assert.equal(addDaysISO("2026-10-26", 1), "2026-10-27");
  assert.equal(addDaysISO("2026-10-31", 1), "2026-11-01");
});

test("applyDailyComplete resets done and advances due", () => {
  const task = { id: 1, title: "Water plants", done: true, due: "2026-10-26", repeat: "daily" };
  const next = applyDailyComplete(task, "2026-10-26");
  assert.equal(next.done, false);
  assert.equal(next.due, "2026-10-27");
  assert.equal(next.title, "Water plants");
});

test("applyDailyComplete uses today when due missing", () => {
  const task = { id: 2, title: "Stretch", done: true, due: "", repeat: "daily" };
  const next = applyDailyComplete(task, "2026-01-15");
  assert.equal(next.done, false);
  assert.equal(next.due, "2026-01-16");
});

test("isDailySeries", () => {
  assert.equal(isDailySeries({ repeat: "daily" }), true);
  assert.equal(isDailySeries({ repeat: "" }), false);
  assert.equal(isDailySeries({}), false);
});
