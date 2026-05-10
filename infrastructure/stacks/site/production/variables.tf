variable "environment" {
  type        = string
  description = "Environment name"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be either 'staging' or 'production'"
  }
}

variable "region" {
  type        = string
  description = "AWS region for the blog stack"
}

variable "domain_name" {
  type        = string
  description = "Custom domain for the static site (e.g. jamesmiller.blog)"
}

variable "bucket_name" {
  type        = string
  description = "R2 bucket name for the static site"
}

variable "github_repo" {
  type        = string
  description = "GitHub repository in org/repo format"
}

variable "state_bucket" {
  type        = string
  description = "S3 bucket name used for Terraform remote state (needed to read shared stack outputs)"
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare zone ID for jamesmiller.blog"
}
