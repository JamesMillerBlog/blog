# AI Implementation Evals

Evaluations for the AI issue implementation pipeline. Measures prompt version performance, review efficiency, and code quality trends over time.

## Architecture

| Component | Location | Visibility | Purpose |
|-----------|----------|------------|---------|
| Rubric | `.ai-evals/rubric.json` (this repo) | Public | Quality gate thresholds. Version-controlled alongside prompts. |
| Run data | Private Gist "AI Implementation Evals" | **Private** | Append-only JSONL — one line per completed run. Queryable with `gh api`. |
| Trends | `trends.md` in same private Gist | **Private** | Regenerated summary: avg iterations by prompt version, fix efficiency trend, critical count trend. |

## Run data schema (JSONL)

One line per completed AI implementation:

```json
{
  "date": "2026-05-30",
  "issue": 142,
  "prompt_ver": "1.0",
  "review_ver": "1.1",
  "verdict": "SAFE_TO_PUSH",
  "iterations": 2,
  "critical": 0,
  "high": 1,
  "duration_s": 1247
}
```

**Never included:** issue title, body, file names, finding descriptions, reviewer output, or any user-generated content.

## Querying the private Gist

The Gist is private and accessed via `GH_PR_CREATE_TOKEN`. Query from your local machine:

```bash
# Get the Gist ID (run once, note the ID)
GIST_ID=$(GH_TOKEN=<your-token> gh gist list --limit 100 | grep "AI Implementation Evals" | awk '{print $1}')

# All runs
GH_TOKEN=<your-token> gh api "/gists/$GIST_ID" --jq '.files["runs.jsonl"].content'

# Average iterations per prompt version
GH_TOKEN=<your-token> gh api "/gists/$GIST_ID" --jq '.files["runs.jsonl"].content' | \
  grep '"prompt_ver":"1.1"' | jq -s 'map(.iterations) | add/length'

# Any runs with critical findings
GH_TOKEN=<your-token> gh api "/gists/$GIST_ID" --jq '.files["runs.jsonl"].content' | \
  grep -v '"critical":0'

# All SAFE_TO_PUSH runs (exclude UNKNOWN)
GH_TOKEN=<your-token> gh api "/gists/$GIST_ID" --jq '.files["runs.jsonl"].content' | \
  grep '"SAFE_TO_PUSH"'
```

## Generating trends

```bash
bash scripts/ai-eval-trends.sh
```

Reads the private evals Gist, computes aggregated trends, writes `trends.md` back to the same Gist.

## Security

- **Never make the evals or learnings Gists public.** Both contain data about past AI runs. The learnings Gist in particular catalogs past vulnerabilities — making it public would give attackers a roadmap.
- **`GH_PR_CREATE_TOKEN` must have minimum scopes:** `repo` (PR creation) + `gist` (learnings + evals Gists). Must NOT have: `delete_repo`, `admin:public_key`, `workflow`.
- The pipeline verifies Gist privacy before every write. If a Gist is found to be public, writes are refused with a `SECURITY:` error in the logs.
- Run data (`runs.jsonl`) never stores issue titles, bodies, file paths, or finding descriptions. Only aggregate scores (issue number, verdict, counts, duration).

## Adding or changing rubric thresholds

1. Edit `.ai-evals/rubric.json`
2. Commit with message: `chore: update eval rubric thresholds`
3. Thresholds take effect on the next run — no deployment needed
