# Claude Code Hooks

Hooks are scripts that run automatically in response to Claude Code events.

## What Are Hooks?

Hooks let you:
- Run linters before commits
- Auto-format code on save
- Run tests after changes
- Send notifications
- Validate content

## Hook Types

| Hook | When It Runs |
|------|--------------|
| `PreToolUse` | Before a tool executes |
| `PostToolUse` | After a tool executes |
| `Notification` | When Claude sends notifications |
| `Stop` | When Claude stops |

## Setting Up Hooks

### Step 1: Create Hooks Directory
```bash
mkdir -p .claude/hooks
```

### Step 2: Create Hook Script

**Example: Auto-lint on file write**
```bash
# .claude/hooks/post-write-lint.sh
#!/bin/bash

# This runs after Claude writes a file
FILE="$1"

# Only lint TypeScript/JavaScript files
if [[ "$FILE" == *.ts ]] || [[ "$FILE" == *.tsx ]] || [[ "$FILE" == *.js ]]; then
  npx eslint --fix "$FILE" 2>/dev/null
fi
```

### Step 3: Configure in Settings
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "command": ".claude/hooks/post-write-lint.sh"
      }
    ]
  }
}
```

---

## Practical Hook Examples

### 1. Build Verification After MDX Changes
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write(_posts/*.mdx)",
        "command": "pnpm build --quiet"
      }
    ]
  }
}
```

### 2. Spell Check New Posts
```bash
# .claude/hooks/spellcheck.sh
#!/bin/bash
if [[ "$1" == *"_posts"* ]]; then
  npx cspell "$1" || echo "Spelling issues found"
fi
```

### 3. SEO Validation
```bash
# .claude/hooks/validate-seo.sh
#!/bin/bash
# Check frontmatter has required fields
grep -q "^title:" "$1" || echo "Missing title"
grep -q "^excerpt:" "$1" || echo "Missing excerpt"
grep -q "^coverImage:" "$1" || echo "Missing coverImage"
```

---

## Hook Best Practices

1. **Keep hooks fast** - They run synchronously
2. **Handle errors gracefully** - Don't break the workflow
3. **Log output** - Helps debugging
4. **Test thoroughly** - Hooks affect every operation

---

## Debugging Hooks

```bash
# Test hook manually
.claude/hooks/my-hook.sh /path/to/file

# Check hook is executable
chmod +x .claude/hooks/*.sh

# View Claude Code logs for hook output
```
