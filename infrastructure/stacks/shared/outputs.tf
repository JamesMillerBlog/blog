output "oidc_provider_arn" {
  description = "ARN of the shared GitHub Actions OIDC provider"
  value       = module.github_oidc_provider.oidc_provider_arn
}

output "assets_bucket_name" {
  description = "Shared assets R2 bucket name"
  value       = module.asset_hosting.bucket_name
}

output "posts_bucket_name" {
  description = "Shared posts S3 bucket name"
  value       = module.content_hosting.bucket_name
}

output "posts_bucket_arn" {
  description = "Shared posts S3 bucket ARN"
  value       = module.content_hosting.bucket_arn
}
