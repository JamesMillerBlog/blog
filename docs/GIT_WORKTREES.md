# Git Worktrees Guide

Git worktrees allow you to check out multiple branches into separate directories simultaneously. This means you can have multiple working states of the same repository at the same time, without needing to stash changes or constantly switch branches in a single directory.

## Best Practice: Where Worktrees Live

It is best practice to keep worktrees completely outside of the main repository's directory. A common approach is to use a sibling directory.

For example, if your main repository is in a directory called `Project`, you can create a `Project.worktrees` directory next to it:

```text
Workspace/
├── Project/                              <-- Your main repository
└── Project.worktrees/                    <-- The container for your worktrees
    ├── feature-branch/                   <-- A git worktree
    └── bugfix-branch/                    <-- Another git worktree
```

---

## Worktree Lifecycle Commands

### 1. Create a Worktree

When you create a worktree, you specify the path where it should be created and the branch it should track.

**Create a NEW branch based on `main`:**

```bash
git worktree add -b <new-branch-name> ../Project.worktrees/<new-branch-name> main
```

**Create a local tracking branch based on an existing remote branch:**

```bash
git fetch origin
git worktree add -b <branch-name> ../Project.worktrees/<branch-name>
```

**Check out an already-existing local branch:**

```bash
git worktree add ../Project.worktrees/<branch-name> <branch-name>
```

eg

```bash
git worktree add -b aws-infrastructure ../Blog.worktrees/new-feature
```

### 2. Work in the Worktree

The worktree functions as a normal Git directory. You can `cd` into it, make changes, run your development server, and commit as usual.

```bash
cd ../Project.worktrees/<branch-name>
# Work, commit, push, etc.
```

_Note: Dependencies (like `node_modules`) and ignored files (like `.env`) are not shared between worktrees. You will need to install dependencies and set up environment variables in each new worktree._

### 3. List Active Worktrees

To see all currently active worktrees and their locations:

```bash
git worktree list
```

### 4. Remove a Worktree

Once you are done with a worktree (e.g., after merging a PR), you should remove it.

**Clean removal (preferred):**

```bash
git worktree remove ../Project.worktrees/<branch-name>
```

**Force removal (if it contains untracked or uncommitted files):**

```bash
git worktree remove --force ../Project.worktrees/<branch-name>
```

### 5. Cleanup Stale Worktrees

If you accidentally delete a worktree directory using standard system commands (like `rm -rf`) instead of `git worktree remove`, Git will still retain its internal metadata. To clean up these broken references:

```bash
git worktree prune
```

---

## Rules and Gotchas

- **Branch uniqueness:** You cannot check out the same branch in two different worktrees simultaneously.
- **Dependencies:** Run your package manager install command (e.g., `npm install`, `pnpm install`, `yarn install`) in new worktrees if the dependencies differ from your main worktree.
- **Moving worktrees:** Never use `mv` to rename or move a worktree directory. Always use `git worktree move <old-path> <new-path>`.
