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
| `tests/recurrence.test.mjs` | Unit tests for recurrence |

## Task record

```text
{ id, title, done, due, tags[], repeat? }
```

- `repeat`: `"daily"` or `""` (absent on older rows treated as non-recurring).
- One IndexedDB row is one **series** for daily tasks (edit/delete apply to that row).

## Daily recurrence

When the user marks a daily task **done**:

1. `done` stays **false** (task resets in place; no new row).
2. `due` advances one calendar day from the current due, or from today if due is empty.

Non-recurring tasks toggle `done` normally.

## Verify

```bash
node --test todo/tests/recurrence.test.mjs
```

Browser: add a daily task, complete it, confirm it stays open with due +1 day; use **Edit series** / **Delete series**; reload to confirm persistence.
