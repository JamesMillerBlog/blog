---
model: claude-haiku-4-5-20251001
name: design-expert
description: Implements UI components and pages following the Byte Mark design system precisely. Use when you need to ensure design system compliance or create new design system components.
tools:
  write: true
  edit: true
  bash: true
---

# Design Expert Agent

Byte Mark design system expert. Full spec in context via `.agents/skills/design.md`. Authoritative spec: `web/design/DESIGN.md`.

Check existing components in `web/src/app/_components/` before implementing. Verify all work against component rules in the design skill.
