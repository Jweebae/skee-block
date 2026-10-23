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

## Git and GitHub

- The repository is `Jweebae/skee-block` (PUBLIC, needed for free GitHub Pages); its root is the `website project` folder. Every push to `main` builds and deploys the live site at https://jweebae.github.io/skee-block/, so keep `main` building. Because the repository and these notes are public, never write private information into any tracked file or commit message: no phone numbers, addresses, coordinates, client names, secrets, or anything about the owner's private identity beyond what is already there. After meaningful work: update PROJECT_CONTEXT.md, run `npm run build` and `npm run lint` in `app/`, then commit and `git push` so the other agent sees your work. Pull first (`git pull --rebase`) if the other agent may have pushed.
- The GitHub CLI is at `/Users/mac/.local/bin/gh` (not on PATH) and is already signed in as `Jweebae`; git pushes use it as the credential helper. Do not ask the user for tokens and never write tokens into files.
- Commit with the repository-local identity already configured; do not change global git settings. Keep commit messages factual.
- Never commit `.env*` (except `.env.example`), keys, `node_modules`, `dist`, or the unwatermarked originals in `photo-edits/source` and `photo-edits/enhanced`. Gallery photos in the repository are the watermarked masters in `photo-edits/final/` and the WebP files in `app/src/assets/gallery/`.
- Do not change the repository's visibility, add collaborators, or change hosting without the user's explicit approval.

## Supabase

- The project is `skee-block` (ref `jfojdzzafbosqneervtn`, free plan). Only the publishable key may appear in the app, and only in the git-ignored `app/.env.local`; never a secret/service-role key or database password, and never in docs or commits.
- Schema changes go through migrations, and every migration must also exist as a file in `supabase/migrations/` named `<version>_<name>.sql` (the Supabase GitHub integration applies new files on push to `main`). After `apply_migration`, run `list_migrations`, copy the exact version it recorded into the filename and the exact SQL into the file, then commit and push. A file whose version is not already applied runs on production automatically, so never push an unreviewed or experimental migration file; test first on a throwaway copy of the SQL via `execute_sql`. Keep RLS on for every table, check `get_advisors` after changes, and test with a non-owner account.
- Owners are listed in `public.studio_admins`; add them by SQL only. Do not create real accounts or invent owner emails; ask the user.
- Never store a password or owner credentials anywhere (notes, memory, scripts, commits), even if the user pastes them in chat and offers; do not record the owner's email in tracked files either, because the repository is public. Add owners by looking the account up by email in SQL instead.
- Destructive SQL is declined by the tool permissions in non-interactive runs. Do not retry it verbatim; neutralise what you created (for example ban test users) and give the user the exact statement to run.

## Safety

- No secrets or private account data in project files.
- No fake assumptions when the real code or approved brand files are available.
- No unverified completion claims.
