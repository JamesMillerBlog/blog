terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

provider "cloudflare" {
  # API token read from CLOUDFLARE_API_TOKEN env var
}

data "terraform_remote_state" "shared" {
  backend = "s3"

  config = {
    bucket = var.state_bucket
    key    = "shared/terraform.tfstate"
    region = var.region
  }
}

module "static_site" {
  source = "../../../modules/static_hosting"

  bucket_name           = var.bucket_name
  domain_name           = var.domain_name
  cloudflare_account_id = var.cloudflare_account_id
  cloudflare_zone_id    = var.cloudflare_zone_id
}

resource "cloudflare_workers_script" "site_auth" {
  account_id  = var.cloudflare_account_id
  script_name = "blog-site-auth"
  content     = file("${path.module}/auth.js")
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

resource "cloudflare_workers_route" "site_auth" {
  zone_id = var.cloudflare_zone_id
  pattern = "${var.domain_name}/*"
  script  = cloudflare_workers_script.site_auth.id
}

module "github_actions_roles" {
  source = "../../../modules/github_actions_roles"

  environment       = var.environment
  github_repo       = var.github_repo
  oidc_provider_arn = data.terraform_remote_state.shared.outputs.oidc_provider_arn
  deploy_bucket_arns = [
    data.terraform_remote_state.shared.outputs.posts_bucket_arn,
  ]
}
