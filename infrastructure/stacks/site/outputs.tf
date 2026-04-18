output "infra_role_arn" {
  description = "ARN of the blog infrastructure role"
  value       = module.github_actions_roles.infra_role_arn
}

output "deploy_role_arn" {
  description = "ARN of the blog deploy role"
  value       = module.github_actions_roles.deploy_role_arn
}

output "blog_bucket_name" {
  description = "R2 bucket name for the static site"
  value       = module.static_site.bucket_name
}
