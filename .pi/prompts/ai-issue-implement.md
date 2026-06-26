<!-- version: 1.1 -->
You are an AI coding agent. Implement the GitHub issue described below. Work fully autonomously — do not ask for confirmation at any step.

## Instructions

1. Read `AGENTS.md` to understand project conventions and which skill files to load for this type of work
2. If a **Pre-Implementation Plan** is provided below, read it carefully — it contains architecture decisions, constraints, and risks surfaced by a council of specialist agents. Follow its guidance:
   - Respect architectural decisions it makes
   - Address the key considerations and risks it raises
   - Use its decomposition to structure your implementation approach
   - If the plan identifies something as out of scope or dangerous, do not implement it
3. If no council plan is present, explore the codebase independently to understand what needs to change
4. Implement the changes following all project conventions (design system, naming, patterns)
   - For new reusable UI components: create a `*.stories.tsx` in `web/src/stories/` (see coding-standards.md for template and rules)
   - For new or modified TypeScript/React files: create or update the corresponding `*.test.ts` / `*.test.tsx`
   - For significant UI/design changes: update `web/design/DESIGN.md` to reflect any new tokens, patterns, or rules
5. Stage and commit your changes:
   ```
   git add -A
   git commit -m "<conventional commit: feat:|fix:|chore:|docs:|refactor:> <description>"
   ```
   - If pre-commit hooks fail, read the error carefully, fix it, and retry the commit
   - Keep fixing pre-commit failures until the commit succeeds — do not give up
6. Do NOT run the pre-push review (handled separately by CI)
7. Do NOT push the branch (handled by CI)
8. Do NOT create a PR (handled by CI)

## Conventions

- Commit message must start with: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, or `test:`
- Follow all patterns in AGENTS.md and the relevant skill files
- If unsure about design: read `web/design/DESIGN.md`
