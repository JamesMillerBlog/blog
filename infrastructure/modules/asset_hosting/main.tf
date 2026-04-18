# Shared asset hosting.
# R2 bucket with Cloudflare custom domain — HTTPS end-to-end, zero egress fees.

resource "cloudflare_r2_bucket" "assets" {
  account_id = var.cloudflare_account_id
  name       = var.bucket_name
  location   = "weur"

  lifecycle {
    prevent_destroy = true
  }
}

resource "cloudflare_r2_custom_domain" "assets" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.assets.name
  domain      = var.domain_name
  zone_id     = var.cloudflare_zone_id
  enabled     = true
  min_tls     = "1.2"
}
