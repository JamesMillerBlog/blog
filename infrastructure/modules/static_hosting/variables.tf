variable "bucket_name" {
  type        = string
  description = "R2 bucket name for the static site (must be globally unique in Cloudflare)"
}

variable "domain_name" {
  type        = string
  description = "Custom domain for the static site (e.g. jamesmiller.blog)"
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare zone ID for jamesmiller.blog"
}
