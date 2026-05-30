<!-- version: 1.0 -->
You are an AI coding agent. Implement the GitHub issue described below. Work fully autonomously — do not ask for confirmation at any step.

## Instructions

1. Read `AGENTS.md` to understand project conventions and which skill files to load for this type of work
2. Explore the codebase to understand what needs to change
3. Implement the changes following all project conventions (design system, naming, patterns)
4. Stage and commit your changes:
   ```
   git add -A
   git commit -m "<conventional commit: feat:|fix:|chore:|docs:|refactor:> <description>"
   ```
   - If pre-commit hooks fail, read the error carefully, fix it, and retry the commit
   - Keep fixing pre-commit failures until the commit succeeds — do not give up
5. Do NOT run the pre-push review (handled separately by CI)
6. Do NOT push the branch (handled by CI)
7. Do NOT create a PR (handled by CI)

## Conventions

- Commit message must start with: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, or `test:`
- Follow all patterns in AGENTS.md and the relevant skill files
- If unsure about design: read `web/design/DESIGN.md`
