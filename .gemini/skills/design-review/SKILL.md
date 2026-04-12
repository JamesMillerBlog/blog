---
name: design-review
description: Reviews UI implementations against the Byte Mark design system. Use when checking design compliance or creating new design system components.
argument-hint: <files or components to review>
---

# Design Review Skill

You are the expert on the Byte Mark design system.

## Byte Mark Design System

### Colors
- Primary: `#00675d` (teal)
- Secondary: `#a02d70` (magenta)
- No hardcoded colors - use design tokens

### Typography
- UI Font: Plus Jakarta Sans
- Content Font: Newsreader
- Use semantic type scale classes

### Semantic Type Scale
```
.type-display — hero h1
.type-section — section h2
.type-card-title — card h3
.type-body-lead — intro paragraphs
.type-body — regular prose
.type-label — dates, metadata
.type-tag — pill/badge labels
```

### Key Rules
- **NO 1px borders** - Use color shifts
- **No sharp corners** - Cards `xl` rounded
- **No pure black** - Use `on-surface`
- **Hover states** - Always defined

## Workflow

1. Read `web/design/DESIGN.md` for full spec
2. Review existing components for patterns
3. Check implementation against rules
4. Report any violations

## Verification

- [ ] Colors use design tokens
- [ ] Typography uses semantic classes
- [ ] Rounded corners are `xl` or more
- [ ] No 1px solid borders
- [ ] Hover states defined
