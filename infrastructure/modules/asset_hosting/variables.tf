variable "bucket_name" {
  type        = string
  description = "R2 bucket name for assets (must be globally unique in Cloudflare)"
}

variable "domain_name" {
  type        = string
  description = "Custom domain for the assets CDN (e.g. assets.jamesmiller.blog)"
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare zone ID for jamesmiller.blog"
}
