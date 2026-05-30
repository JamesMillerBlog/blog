# Infrastructure Skill

Full guide: `docs/AWS_INFRASTRUCTURE.md`

## File Locations
- Modules: `infrastructure/modules/`
- Stacks: `infrastructure/stacks/` — `shared` → `site` → `site/ephemeral` (ephemeral: preview environments for AI-generated PRs)
- Vars: `infrastructure/vars/`
- CI/CD: `.github/workflows/`

## Unit Tests
- Config: `infrastructure/vitest.config.ts` (vitest, node env)
- Auth worker tests: `infrastructure/stacks/site/staging/auth.test.ts` — tests Cloudflare Worker Basic Auth logic
- Run: `pnpm test:infra` from repo root
- **Requirement:** Changed `.js`/`.ts` files in infrastructure must have corresponding tests. CI enforces this via `pr-checks.yml`.

## Workflow
1. Review existing state
2. Implement changes
3. `terraform validate && terraform plan` (CI runs `terraform validate` in `infra-deploy.yml` fmt job)
4. `terraform apply`

## Formatting
- **Shell scripts:** 2-space indent (spaces, not tabs). Line continuation with `\`. Pipe chains: `|` at end of continued line, next line indented with 4 spaces for visual alignment.
- **YAML:** 2-space indent. Single-quoted strings (`'value'` not `"value"`, `''` not `""`).
- **Terraform:** `terraform fmt` standard (2-space indent).
- **When editing existing files:** preserve surrounding indentation style. Only change lines that need functional changes.

## Rules
- `shared` stack must apply before `site` (remote state dependency)
- Secrets via environment variables or AWS Secrets Manager — never committed
- Least-privilege IAM
