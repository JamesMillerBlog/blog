# Coding Standards

Read this file when writing or reviewing TypeScript/React code in this repo.

## TDD — Test-Driven Development

Write tests before or alongside implementation. Every new source file must have a corresponding `*.test.ts` or `*.test.tsx` file.

- Use `vitest` + `@testing-library/react`
- Use factory functions (e.g. `makePost()`) for test data, not inline literals
- Mock at the boundary — mock external modules (`next/image`, `framer-motion`), not internal helpers
- Coverage thresholds (enforced in CI): 46% lines/statements, 53% functions, 30% branches

## Functional Style

**Prefer `const` + arrow functions** for utilities, helpers, and non-exported internals:

```ts
// preferred
const formatDate = (date: Date): string => date.toISOString().slice(0, 10)

// avoid for utilities
function formatDate(date: Date): string { ... }
```

**Use `const` arrow functions for all exported React components** (ESLint enforces this as an error):

```tsx
// required
export const PostCard = ({ post }: Props): JSX.Element => { ... }

// will error — do not use
export function PostCard({ post }: Props) { ... }
```

**Next.js App Router pages/layouts are the only exception** (Next.js requires default function exports):

```tsx
// required by Next.js
export default function Page() { ... }
```

**Callbacks must use arrow functions** (`prefer-arrow-callback` is enforced):

```ts
// required
items.map((item) => item.id)

// will lint-warn
items.map(function(item) { return item.id })
```

## Immutability

- Never mutate module-level state
- Prefer `const` over `let`; avoid `var`
- Use non-mutating array methods (`map`, `filter`, `reduce`) over loops with push/splice

## TypeScript

- Strict mode is on — no implicit `any`
- Avoid `as` type assertions and `!` non-null assertions unless unavoidable
- Use explicit return types on exported functions
- Prefer `interface` for object shapes that may be extended, `type` for unions and primitives

## File Size

- Max 200 lines per file (ESLint warns above this)
- Max complexity 10 per function (ESLint warns above this)
- Split large components into smaller focused ones

## Auditing

Run before opening a PR:

```bash
pnpm audit:standards       # quick check (run from repo root)
pnpm audit:standards:full  # includes AI deep review
```

Coverage is also gated in CI — PRs that drop below thresholds will fail the checks job and trigger an auto-fix attempt.
