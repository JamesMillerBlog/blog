# Claude Code Skills

Skills are custom slash commands that extend Claude Code's capabilities. They're defined as markdown files in `.claude/commands/`.

## Available Skills

### `/new-post [topic]`
Creates a new blog post with AI assistance.

**Usage:**
```
/new-post WebXR hand tracking tutorial
/new-post serverless authentication patterns
/new-post (will prompt for topic)
```

**What it does:**
1. Checks existing posts to avoid duplication
2. Generates URL-friendly slug
3. Creates MDX file with frontmatter
4. Writes content in your style
5. Verifies build passes
6. Suggests social media content

---

### `/social [post-slug]`
Generates social media content to promote a blog post.

**Usage:**
```
/social multiplayer-webxr-readyplayer-me-avatars-part-1
/social (will prompt or use most recent post)
```

**What it generates:**
- Twitter/X thread (5-7 tweets)
- LinkedIn post
- 3-5 standalone tweets for scheduling
- Relevant hashtags

---

### `/ideas`
Brainstorms new blog post ideas based on trends and your existing content.

**Usage:**
```
/ideas
/ideas WebXR
/ideas serverless
```

**What it does:**
1. Analyzes your existing posts
2. Identifies content gaps
3. Researches current trends
4. Generates 5-10 prioritized ideas
5. Suggests which to write first

---

### `/review [post-slug]`
Reviews and improves a blog post draft.

**Usage:**
```
/review my-new-post
/review (will prompt or use most recent)
```

**What it checks:**
- Technical accuracy
- SEO optimization (title, excerpt, headings)
- Grammar and spelling
- Code example correctness
- Internal linking opportunities

---

## Creating New Skills

1. Create a markdown file in `.claude/commands/`:
```bash
touch .claude/commands/my-skill.md
```

2. Define the skill:
```markdown
# Skill Name

Description of what this skill does.

## Instructions

1. Step one
2. Step two
3. Use $ARGUMENTS for user input

## Output

What the skill should produce.
```

3. Use it:
```
/my-skill arguments here
```

---

## Tips

- Skills have access to the full codebase
- Use `$ARGUMENTS` to capture user input
- Skills can call other tools (read files, run commands, etc.)
- Keep instructions clear and specific
- Test with different inputs
