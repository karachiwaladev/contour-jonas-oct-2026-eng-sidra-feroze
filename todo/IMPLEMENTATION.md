# Todo app — implementation notes

Client-only todo list stored in **IndexedDB** (`todo` / `tasks`). Open `index.html` over HTTP (not `file://`) for ES modules.

## Layout

| File | Role |
| --- | --- |
| `index.html` | Markup, styles, bootstraps `app.js` |
| `app.js` | UI, filters, edit/delete series |
| `lib/store.js` | IndexedDB access |
| `lib/task-model.js` | Parsing titles, due dates, tags, repeat |
| `lib/recurrence.js` | Daily complete → reset same row, advance due |
| `lib/priority.js` | Parse, default medium, filter, sort high → low |
| `tests/recurrence.test.mjs` | Unit tests for recurrence |
| `tests/priority.test.mjs` | Unit tests for priority |

## Task record

```text
{ id, title, done, due, tags[], repeat?, priority }
```

- `repeat`: `"daily"` or `""` (absent on older rows treated as non-recurring).
- `priority`: `"high"` | `"medium"` | `"low"` (missing or invalid → **medium**).
- One IndexedDB row is one **series** for daily tasks (edit/delete apply to that row).

## Priority

- Add and edit include a priority select (default medium).
- Filter: All / High / Medium / Low.
- List sort: high, then medium, then low, then `id`.

## Daily recurrence

When the user marks a daily task **done**:

1. `done` stays **false** (task resets in place; no new row).
2. `due` advances one calendar day from the current due, or from today if due is empty.

Non-recurring tasks toggle `done` normally.

## Verify

```bash
node --test --experimental-test-coverage todo/tests/priority.test.mjs todo/tests/recurrence.test.mjs
```

Last run: `priority.js` line **100%** / branch **87.5%** / funcs **100%**; `recurrence.js` 100 / 80 / 100 (9 tests).

Browser: add tasks at high/medium/low; confirm sort order; filter by priority; edit priority; reload for persistence.
