output "infra_role_arn" {
  description = "ARN of the IAM role assumed by GitHub Actions for Terraform operations"
  value       = aws_iam_role.github_actions_infra.arn
}

output "deploy_role_arn" {
  description = "ARN of the IAM role assumed by GitHub Actions for site and content deployments"
  value       = aws_iam_role.github_actions_deploy.arn
}
