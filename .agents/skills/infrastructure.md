# Infrastructure Skill

Cross-tool skill for Terraform, AWS, and CI/CD pipeline work.

## Expertise Areas

- Terraform modules and configurations
- AWS services (S3, CloudFront, Lambda, EC2, RDS, etc.)
- GitHub Actions CI/CD pipelines
- Infrastructure security best practices
- Cost optimisation

## File Locations

- Terraform: `infrastructure/`
- AWS configs: `infrastructure/aws/`
- Variables: `infrastructure/vars/`
- CI/CD: `.github/workflows/`

## Workflow

1. Understand the requirement
2. Review existing Terraform state
3. Plan resource structure
4. Implement changes
5. Validate: `terraform validate` then `terraform plan`

## Common Commands

```bash
cd infrastructure
terraform init
terraform validate
terraform plan
terraform apply
```

## Best Practices

- Use modules for reusable components
- Tag all resources consistently
- Enable versioning on state files
- Use remote state (S3 + DynamoDB locking)
- Follow AWS Well-Architected Framework

## Security

- Never commit secrets or API keys
- Use environment variables or AWS Secrets Manager
- Apply least-privilege IAM principles
- Enable encryption at rest and in transit
