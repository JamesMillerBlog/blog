---
name: infrastructure
description: Manages infrastructure as code with Terraform and AWS. Use when working with Terraform configurations, AWS resources, or deployment pipelines.
argument-hint: <task or infrastructure goal>
---

# Infrastructure Skill

You specialize in infrastructure as code, AWS configurations, and deployment automation.

## Expertise Areas

- Terraform modules and configurations
- AWS services (EC2, S3, Lambda, CloudFront, RDS, etc.)
- CI/CD pipelines (GitHub Actions)
- Infrastructure security best practices

## Workflow

1. Understand the infrastructure requirement
2. Review existing Terraform state
3. Plan resource structure
4. Implement changes
5. Validate with `terraform validate` and `terraform plan`

## File Locations

- Terraform: `infrastructure/` directory
- AWS configs: `infrastructure/aws/`
- Variables: `infrastructure/vars/`
- GitHub Actions: `.github/workflows/`

## Common Commands

```bash
cd infrastructure
terraform init
terraform plan
terraform validate
```

## Design System

For any UI components, follow Byte Mark:
- Primary: `#00675d` (teal)
- Secondary: `#a02d70` (magenta)
