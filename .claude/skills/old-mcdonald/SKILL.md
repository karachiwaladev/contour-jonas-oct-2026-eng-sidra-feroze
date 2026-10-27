---
name: old-mcdonald
description: >-
  UX test persona for an older user with little tech exposure. Use during
  factory-loop browser verification (§5) of any UI change, or when asked to
  check a page "as Old McDonald" for readability, large targets, plain words,
  and safe recovery from mistakes.
---

# Old McDonald (UX test persona)

A fictional user. Walk the ticket's feature as him in the automation browser, then report what would stop him. Do not fix findings unless they are in the ticket's scope; list them in the PR comment.

## Who he is

- 74, retired dairy farmer. Uses a hand-me-down tablet and a family laptop for weather, email, and video calls with grandchildren.
- Reading glasses; keeps browser zoom at 200%. Mild hand tremor: misses small targets and sometimes double-clicks.
- Reads every word literally. Does not know "filter", "tag", "toggle", "recurrence", or what an unlabeled icon means.
- Never uses keyboard shortcuts, right-click, hover, or drag. Uses Tab and Enter only when someone showed him.
- Worried about breaking things or losing his list. Leaves the page and comes back later.

## What he needs (checks)

| Need | Pass when |
| --- | --- |
| Readable at 200% zoom | No horizontal scroll, nothing clipped or overlapping. Body text is at least 16px before zoom. |
| Contrast | Text vs background is at least 4.5:1 (WCAG 1.4.3). |
| Big targets | Buttons, checkboxes, and links are at least 44×44 CSS px (WCAG 2.5.5). |
| Plain words | Every control has a visible text label in everyday words. No icon-only buttons. |
| Says what happened | After add, edit, complete, or delete, the screen visibly changes or confirms it. |
| Safe mistakes | Delete (especially a whole series) asks first or can be undone. A double-click does not add twice. |
| Comes back later | His tasks are still there after a reload. |
| Keyboard path | Tab reaches every control in reading order, and focus is visible. |

## How to run it

1. Serve the page and open it with the browser MCP as in factory-loop §5.
2. Set 200% zoom: `browser_cdp` → `Runtime.evaluate` with `document.body.style.zoom = '2'`, then `browser_take_screenshot`.
3. Measure with one read-only `Runtime.evaluate` (`returnByValue: true`):

```js
(() => {
  const ctl = [...document.querySelectorAll('button, a, input, select, textarea, [role=button]')];
  const small = ctl.filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.width < 44 || r.height < 44); })
    .map(e => e.id || e.name || e.textContent.trim().slice(0, 30) || e.tagName);
  const unlabeled = ctl.filter(e => !(e.labels?.length || e.getAttribute('aria-label') || e.textContent.trim()))
    .map(e => e.id || e.name || e.tagName);
  const tinyText = [...document.querySelectorAll('body *')].filter(e => e.childNodes[0]?.nodeType === 3
    && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 16).length;
  return { small, unlabeled, tinyText, hScroll: document.documentElement.scrollWidth > innerWidth };
})()
```

4. Walk the ticket's paths as him, using `browser_click` on fresh snapshot refs only: add a task, double-click Add, complete it, delete it, reload. Read every label and message aloud in your head: would he understand it?
5. Tab through the page once and check that focus is visible.
6. Reset zoom (`document.body.style.zoom = ''`).

## Report

Add this to the PR comment (factory-loop §6 step 4):

```markdown
**Old McDonald check** (200% zoom, mouse + Tab only)

| Need | Result | Detail |
| --- | --- | --- |
| Readable at 200% | pass / fail | ... |
| ... | ... | ... |

Would stop him: <one line, or "nothing">
```

Severity: **blocker** (he cannot finish the task or loses data), **friction** (he finishes but struggles), **polish**.

## Safety

- Read-only DOM checks. Do not change app data beyond the test tasks you create, and delete those afterwards.
- The persona is fictional. Do not use real names, photos, or personal data.
