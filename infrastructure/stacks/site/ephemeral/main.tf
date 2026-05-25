terraform {
  required_version = ">= 1.9.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }

  # Backend configured fully via -backend-config flags at terraform init time.
  # Each PR gets its own state: ephemeral/pr-{number}/terraform.tfstate
  backend "s3" {}
}

provider "cloudflare" {
  # API token read from CLOUDFLARE_API_TOKEN env var
}

locals {
  domain      = "pr-${var.pr_number}.staging.jamesmiller.blog"
  bucket_name = "jamesmiller-blog-pr-${var.pr_number}"
}

# R2 bucket — no prevent_destroy, intentionally ephemeral
resource "cloudflare_r2_bucket" "preview" {
  account_id = var.cloudflare_account_id
  name       = local.bucket_name
  location   = "weur"
}

resource "cloudflare_r2_custom_domain" "preview" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.preview.name
  domain      = local.domain
  zone_id     = var.cloudflare_zone_id
  enabled     = true
  min_tls     = "1.2"
}

# Reuse staging's auth.js — same Basic Auth + URL rewrite logic, no duplication
resource "cloudflare_workers_script" "auth" {
  account_id  = var.cloudflare_account_id
  script_name = "blog-preview-auth-pr-${var.pr_number}"
  content     = file("${path.module}/../staging/auth.js")
  main_module = "auth.js"

  compatibility_date = "2024-01-01"

  bindings = [
    {
      name = "USERNAME"
      type = "secret_text"
      text = var.basic_auth_username
    },
    {
      name = "PASSWORD"
      type = "secret_text"
      text = var.basic_auth_password
    }
  ]
}

resource "cloudflare_workers_route" "auth" {
  zone_id = var.cloudflare_zone_id
  pattern = "${local.domain}/*"
  script  = cloudflare_workers_script.auth.id
}

output "preview_url" {
  value = "https://${local.domain}"
}

output "bucket_name" {
  value = local.bucket_name
}
