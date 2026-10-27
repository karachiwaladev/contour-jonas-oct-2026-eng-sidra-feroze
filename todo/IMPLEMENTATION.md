# Todo app — implementation notes

Client-only todo list stored in **IndexedDB** (`todo` / `tasks`). Open `index.html` over HTTP (not `file://`) for ES modules.

## Layout

| File | Role |
| --- | --- |
| `index.html` | Markup, CSP, bootstraps `app.js` |
| `styles.css` | Layout (no inline CSS, for CSP) |
| `app.js` | UI, filters, edit/delete series |
| `lib/store.js` | IndexedDB access |
| `lib/task-model.js` | Parsing titles, due dates, tags, repeat; sanitize on load |
| `lib/recurrence.js` | Daily complete → reset same row, advance due |
| `lib/priority.js` | Parse, default medium, filter, sort high → low |
| `lib/counts.js` | Open/done tallies for the footer (all tasks, not the filter) |
| `tests/recurrence.test.mjs` | Unit tests for recurrence |
| `tests/priority.test.mjs` | Unit tests for priority |
| `tests/task-model.test.mjs` | Sanitization / parse tests |
| `tests/counts.test.mjs` | Unit tests for footer counts |

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

## Footer counts

Footer shows `N open · M done` for **all** stored tasks. Filters change the list only. Counts update on add, toggle, edit, and delete. Render uses `textContent`.

## Daily recurrence

When the user marks a daily task **done**:

1. `done` stays **false** (task resets in place; no new row).
2. `due` advances one calendar day from the current due, or from today if due is empty.

Non-recurring tasks toggle `done` normally.

## Security

- CSP: scripts and styles from `'self'` only; no `connect-src`, objects, or `base-uri`.
- Titles and tags drop control characters and `<>` before store and on load (`sanitizeTask`).
- Render uses `textContent` / `createElement` only (no `innerHTML`).
- Priority is a whitelist (`high|medium|low`).
- No tokens or keys in this app (client-only IndexedDB). Repo `.gitignore` and the stop hook block `.env`, `*.pem`, `*.key`, and secret-looking file contents.

## Verify

```bash
node --test --experimental-test-coverage --test-coverage-include=todo/lib/** todo/tests/*.mjs
```

Last run: 20 tests; `counts.js` 100/100/100.

Browser: footer updates on add / complete / delete; filter does not change totals.
