variable "region" {
  type        = string
  description = "AWS region for shared infrastructure"
}

variable "assets_bucket_name" {
  type        = string
  description = "R2 bucket name for shared assets (must be globally unique in Cloudflare)"
}

variable "assets_domain_name" {
  type        = string
  description = "Custom domain for the assets CDN"
}

variable "posts_bucket_name" {
  type        = string
  description = "S3 bucket name for storing MDX blog posts"
}

variable "github_oidc_thumbprint" {
  type        = string
  description = "SHA-1 thumbprint of GitHub's OIDC root CA certificate"
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare zone ID for jamesmiller.blog"
}
