# Git Worktrees Guide

Git worktrees let you check out multiple branches into separate directories simultaneously — same repo, multiple working states, no stashing.

## Why Use Worktrees?

| Scenario | Without Worktrees | With Worktrees |
|----------|-------------------|----------------|
| Bug fix while writing a post | Stash, switch, fix, switch, unstash | Open bug-fix worktree, fix, done |
| Review a PR while coding | Stash everything, checkout PR branch | Open PR in its own worktree |
| Compare two implementations | Copy-paste between files | Open both side by side |
| Run two dev servers at once | Not possible on same branch | Each worktree runs independently |

---

## Where Worktrees Live

Worktree files live in whatever directory you specify when creating them (typically alongside the main repo). Git tracks them internally in `.git/worktrees/` inside your main repo.

**On disk:**
```
Creative_Technology/
├── Blog/              ← main repo (.git lives here)
├── blog-feature/      ← feature worktree (just a directory)
├── blog-hotfix/       ← hotfix worktree
└── blog-drafts/       ← drafts worktree
```

**Inside `.git`:**
```
Blog/.git/worktrees/
├── blog-feature/      ← metadata only (not the actual files)
└── blog-hotfix/
```

You never need to touch `.git/worktrees/` directly — git manages it.

### Seeing all active worktrees

```bash
git worktree list
```

Example output:
```
/Users/jamesmiller/Documents/Creative_Technology/Blog           abc1234 [main]
/Users/jamesmiller/Documents/Creative_Technology/blog-feature   def5678 [feature/new-homepage]
/Users/jamesmiller/Documents/Creative_Technology/blog-hotfix    ghi9012 [hotfix/fix-broken-nav]
```

Shows each worktree's path, current commit, and branch.

---

## What Branch is a Worktree Based On?

Each worktree can be based on any branch, commit, or starting point — it is not automatically based on `main`. You control this when creating it.

```bash
# Based on main (most common — start fresh from production)
git worktree add -b feature/new-homepage ../blog-feature main

# Based on an existing branch (pick up where it left off)
git worktree add ../blog-hotfix hotfix/fix-broken-nav

# Based on a specific commit
git worktree add ../blog-experiment abc1234

# Based on a remote branch
git fetch origin
git worktree add ../blog-pr origin/pr-branch-name
```

**If you don't specify a base**, git uses `HEAD` of your current branch — which is `main` if that's what you have checked out, but not guaranteed.

**For this blog, the typical pattern:**
| Worktree purpose | Base on |
|-----------------|---------|
| New feature | `main` — start from stable production |
| Hotfix | `main` — fix what's currently live |
| Draft posts | `main` or a long-lived `drafts` branch |
| PR review | The remote PR branch |

---

## Full Lifecycle

### 1. Create a Worktree

```bash
# From anywhere inside the main repo
cd /Users/jamesmiller/Documents/Creative_Technology/Blog

# New branch based on main (recommended default)
git worktree add -b feature/new-homepage ../blog-feature main

# New branch based on an existing branch
git worktree add -b hotfix/fix-broken-nav ../blog-hotfix main

# Check out an already-existing branch
git worktree add ../blog-drafts drafts
```

### 2. Work in the Worktree

The worktree is a fully normal directory — `cd` into it and work as usual:

```bash
cd ../blog-feature/web
pnpm install   # only needed if package.json changed vs main
pnpm dev       # runs on port 3000 by default
```

To run both worktrees simultaneously, use different ports:

```bash
# Terminal 1 — main
cd Blog/web && pnpm dev --port 3000

# Terminal 2 — feature worktree
cd ../blog-feature/web && pnpm dev --port 3001
```

### 3. Commit and Push

```bash
cd ../blog-feature
git add .
git commit -m "feat: new homepage layout"
git push -u origin feature/new-homepage
```

### 4. Merge / PR

Create your PR from the pushed branch as normal. Once merged, clean up the worktree.

### 5. Remove the Worktree

```bash
# Clean removal (preferred)
git worktree remove ../blog-feature

# If the above fails (untracked files etc.), force it
git worktree remove --force ../blog-feature

# If you deleted the directory manually, prune the stale git reference
git worktree prune
```

### 6. Verify

```bash
git worktree list
# Should only show your main worktree
```

---

## Opening Each Worktree in Its Own Editor Window

Yes — each worktree is just a directory, so editors treat it as a completely independent project.

### VS Code

```bash
# Open as a new window
code /Users/jamesmiller/Documents/Creative_Technology/blog-feature

# Or from inside the worktree
cd ../blog-feature && code .
```

You'll get two separate VS Code windows, each with their own file explorer, terminal, and Source Control panel showing only that branch's changes.

### Cursor

```bash
cursor /Users/jamesmiller/Documents/Creative_Technology/blog-feature

# Or
cd ../blog-feature && cursor .
```

### Multiple editors simultaneously

You can have `Blog/` open in one window and `blog-feature/` in another at the same time. They share the same `.git` database so commits from either window are immediately visible in both, but each editor only shows its own working directory.

---

## Claude Code Per Worktree

Claude Code scopes its context (CLAUDE.md, memory, working directory) to whichever directory it's opened in:

```bash
cd ../blog-feature
claude
```

Or without changing directory:

```bash
claude --cwd ../blog-feature
```

---

## Common Workflows

### Writing a draft while fixing a bug

```bash
# You're writing a post in the drafts worktree
cd ../blog-drafts
# editing _posts/new-post.mdx...

# Bug reported — don't touch your draft
cd ../blog-hotfix
git checkout -b fix/broken-nav
# fix the bug, commit, push, PR

# Back to your draft exactly where you left it
cd ../blog-drafts
```

### Running feature and production simultaneously

```bash
# Terminal 1 — production
cd Blog/web && pnpm dev --port 3000

# Terminal 2 — feature branch
cd ../blog-feature/web && pnpm dev --port 3001

# Compare at localhost:3000 and localhost:3001
```

### Reviewing a PR

```bash
git fetch origin
git worktree add ../blog-pr-123 origin/pr-branch-name

# Open in a new editor window
code ../blog-pr-123

# Clean up when done
git worktree remove ../blog-pr-123
```

---

## Rules and Gotchas

- **You cannot check out the same branch in two worktrees** — git prevents this
- **`node_modules` is not shared** — each worktree needs its own `pnpm install` if dependencies differ from main
- **`.env` files are not shared** — copy or symlink as needed
- **`git worktree prune`** cleans up stale `.git/worktrees/` entries if you deleted a directory manually
- **Worktrees are local only** — they don't affect the remote or other developers
