# Software factory

This repo is a software factory. Tickets arrive as GitHub issues. The factory loop picks up each open issue, does the work, opens a pull request, and waits for manual review before closing the issue. We build and improve the loop. Features live in their own project folders.

## Progressive disclosure

This file is the index only. It stays under 100 lines. Read a project folder when that project is in scope, and skip the others. Links go one level deep: from this index to a project file, not through a chain of indexes.

When a project grows, add detail inside its folder. Update the row here. Do not paste that detail into this file.

## Rules

- One project, one folder.
- This file is the only index. Add, rename, or remove a project here in the same change as its folder.
- Keep this file under 100 lines.
- Training repo only: no Jonas or Contour product code, no real keys.

## Index

| Project | Folder | What it is |
| --- | --- | --- |
| Factory loop | `.cursor/skills/factory-loop/` | Picks up GitHub issues: clarify, plan and approval, implement on a feature branch, browser verify, open a PR and wait for manual review, then label `answered` and close. Factual tickets skip build/PR. See `SKILL.md`. |
| Prompt log | `.cursor/hooks/` | On each agent stop, append new session prompts as JSONL (`log-prompts.ps1`) and commit plus push tracked changes (`commit-push.ps1`). |
| Todo | `todo/` | Client-side todo list in IndexedDB. Add, mark done, delete, set a due date and tags, and filter by status or tag. Open `index.html`. |
