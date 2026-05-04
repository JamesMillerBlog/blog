variable "environment" {
  type        = string
  description = "Deployment environment name used to namespace IAM role names"
}

variable "github_repo" {
  type        = string
  description = "GitHub repository in org/repo format"
}

variable "oidc_provider_arn" {
  type        = string
  description = "ARN of the shared GitHub OIDC provider"
}

variable "deploy_bucket_arns" {
  type        = list(string)
  description = "S3 bucket ARNs the deploy role may read or write"
}

variable "content_github_repo" {
  type        = string
  description = "GitHub repo for the content repo in org/repo format (e.g. JamesMillerBlog/blog-content)"
}
