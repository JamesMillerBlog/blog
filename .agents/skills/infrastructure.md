# Infrastructure Skill

Full guide: `docs/AWS_INFRASTRUCTURE.md`

## File Locations
- Modules: `infrastructure/modules/`
- Stacks: `infrastructure/stacks/` (`shared` then `site`)
- Vars: `infrastructure/vars/`
- CI/CD: `.github/workflows/`

## Workflow
1. Review existing state
2. Implement changes
3. `terraform validate && terraform plan`
4. `terraform apply`

## Rules
- `shared` stack must apply before `site` (remote state dependency)
- Secrets via environment variables or AWS Secrets Manager — never committed
- Least-privilege IAM
