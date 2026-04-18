# Static site hosting for one blog environment.
# R2 bucket with Cloudflare custom domain — HTTPS end-to-end, zero egress fees.

resource "cloudflare_r2_bucket" "site" {
  account_id = var.cloudflare_account_id
  name       = var.bucket_name
  location   = "weur"

  lifecycle {
    prevent_destroy = true
  }
}

resource "cloudflare_r2_custom_domain" "site" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.site.name
  domain      = var.domain_name
  zone_id     = var.cloudflare_zone_id
  enabled     = true
  min_tls     = "1.2"
}

# Rewrite extensionless paths to .html so Next.js static export URLs work cleanly.
# e.g. /about → /about.html, / → /index.html
resource "cloudflare_ruleset" "static_site_rewrite" {
  zone_id = var.cloudflare_zone_id
  name    = "Static site URL rewrite (${var.domain_name})"
  kind    = "zone"
  phase   = "http_request_transform"

  rules = [
    {
      description = "Rewrite / to /index.html"
      expression  = "http.host eq \"${var.domain_name}\" and http.request.uri.path eq \"/\""
      action      = "rewrite"
      action_parameters = {
        uri = {
          path = {
            value = "/index.html"
          }
        }
      }
      enabled = true
    },
    {
      description = "Append .html to extensionless paths"
      expression  = "http.host eq \"${var.domain_name}\" and not http.request.uri.path contains \".\" and not http.request.uri.path eq \"/\""
      action      = "rewrite"
      action_parameters = {
        uri = {
          path = {
            expression = "concat(http.request.uri.path, \".html\")"
          }
        }
      }
      enabled = true
    }
  ]
}
