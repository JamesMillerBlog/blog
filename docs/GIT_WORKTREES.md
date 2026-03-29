# Git Worktrees Guide

Git worktrees let you work on multiple branches simultaneously without stashing or switching.

## Why Use Worktrees?

| Scenario | Without Worktrees | With Worktrees |
|----------|-------------------|----------------|
| Bug fix while writing post | Stash, switch, fix, switch, unstash | Just open bug-fix worktree |
| Review PR while coding | Stash everything, checkout PR | Open PR in separate worktree |
| Compare implementations | Cherry-pick or copy-paste | Open both side by side |

## Practical Setup for Blog

### Create Worktrees Directory
```bash
# From your main blog directory
cd /Users/jamesmiller/Documents/Creative_Technology/Blog

# Create worktrees for different purposes
git worktree add ../blog-drafts drafts      # Draft posts branch
git worktree add ../blog-hotfix hotfix      # Quick fixes
git worktree add ../blog-features feature   # New features
```

### Directory Structure
```
Creative_Technology/
├── Blog/              # Main branch (production)
├── blog-drafts/       # Drafts worktree
├── blog-hotfix/       # Hotfix worktree
└── blog-features/     # Features worktree
```

## Common Commands

### List Worktrees
```bash
git worktree list
```

### Add New Worktree
```bash
# From new branch
git worktree add ../path branch-name

# From existing branch
git worktree add ../path existing-branch
```

### Remove Worktree
```bash
git worktree remove ../path
# or
rm -rf ../path && git worktree prune
```

## Blog Workflow Example

### Scenario: Writing a draft while fixing a bug

**1. You're writing a draft post:**
```bash
cd ../blog-drafts
# Writing new-webxr-post.mdx
```

**2. Bug reported in production:**
```bash
# Don't interrupt your draft!
cd ../blog-hotfix
git checkout -b fix/broken-link
# Fix the bug
git commit -m "Fix broken link"
git push
# Create PR, merge to main
```

**3. Continue your draft:**
```bash
cd ../blog-drafts
# Your draft is exactly where you left it
```

## Tips

1. **Name worktrees clearly** - `blog-drafts`, `blog-hotfix`, etc.
2. **Keep main clean** - Use worktrees for experiments
3. **Prune regularly** - `git worktree prune`
4. **Don't checkout same branch twice** - Git prevents this

## With Claude Code

You can run Claude Code in any worktree:
```bash
cd ../blog-drafts
claude  # Opens Claude in draft context
```

Or specify working directory:
```bash
claude --cwd ../blog-drafts
```
