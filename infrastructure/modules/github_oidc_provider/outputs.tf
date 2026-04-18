output "oidc_provider_arn" {
  description = "ARN of the GitHub Actions OIDC provider for this AWS account"
  value       = aws_iam_openid_connect_provider.github.arn
}
