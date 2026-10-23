# AGENTS.md

## Scope

This project lives in the Skee Barber Shop workspace on the Desktop. The active development folder is:

- /Users/mac/Desktop/skee barber shop /website project

The approved visual identity source is:

- /Users/mac/Desktop/skee barber shop /visual identity

## Required behavior

1. Verify the correct Skee Barber Shop workspace before making any change.
2. Read PROJECT_CONTEXT.md before continuing significant work.
3. Use the website project folder for website development.
4. Use the visual identity folder as the approved design and branding reference.
5. Respect all prior business requirements, branding decisions, and architecture choices.
6. Do not redesign approved elements without explicit authorization.
7. Do not modify unrelated files.
8. Never expose or store credentials, API keys, tokens, or other private secrets in project memory.
9. After meaningful milestones, update PROJECT_CONTEXT.md.
10. When requirements, priorities, or constraints change, update the relevant project memory files.
11. Before finishing a task, verify the current implementation against the actual repository state.
12. Never claim a feature is complete unless it has been checked in the actual app.

## Project rules

- Treat Skee as the public-facing barber identity and Said as the private/admin identity.
- Keep the project aligned with the luxury black/white/gold brand language.
- Prefer the actual repository state over stale conversation memory when they disagree.
- Keep the project low-cost and free-tier-friendly unless a different requirement is explicitly approved.
- Do not add features, dependencies, or redesigns outside the requested task.

## Documentation workflow

- Keep PROJECT_CONTEXT.md as the main memory file for project state, decisions, and milestones.
- Update it incrementally when work changes the project understanding.
- Do not rewrite accurate context unnecessarily.

## Multiple agents

- ChatGPT (desktop Work/Codex) and Claude Code both work on this project. AGENTS.md and PROJECT_CONTEXT.md are the only shared memory between them; the user expects both to be kept current.
- Read both files at the start of a session; the other agent may have changed the code since you last saw it.
- Update PROJECT_CONTEXT.md as you go, not only at the end; an agent can be cut off by usage limits mid-task. Record half-finished work (what is done, what is missing, exact file paths) so the other agent can resume.
- Never leave the app in a broken state: do not reference files (images, modules) that do not exist yet. Run `npm run build` in `app/` before stopping.
- Generated or edited images are saved in the workspace, never only in chat or the Downloads folder: candidates waiting for review go in `photo-edits/review/`, approved edits in `photo-edits/enhanced/`.
- Gallery photos carry a small white Skee logo watermark (bottom-right). Always produce the gallery WebP files with `photo-edits/make-gallery-webp.sh white`; never copy an unwatermarked image into `app/src/assets/gallery/`.
- AI-edited client photos go on the website only after the user explicitly approves each one. Until then the gallery tile stays empty; never fill it with a candidate, an interim crop or the original.

## Supabase

- The project is `skee-block` (ref `jfojdzzafbosqneervtn`, free plan). Only the publishable key may appear in the app, and only in the git-ignored `app/.env.local`; never a secret/service-role key or database password, and never in docs or commits.
- Schema changes go through migrations (the Supabase MCP `apply_migration`, or SQL files committed once a repository exists). Keep RLS on for every table, check `get_advisors` after changes, and test with a non-owner account.
- Owners are listed in `public.studio_admins`; add them by SQL only. Do not create real accounts or invent owner emails; ask the user.
- Destructive SQL is declined by the tool permissions in non-interactive runs. Do not retry it verbatim; neutralise what you created (for example ban test users) and give the user the exact statement to run.

## Safety

- No secrets or private account data in project files.
- No fake assumptions when the real code or approved brand files are available.
- No unverified completion claims.
