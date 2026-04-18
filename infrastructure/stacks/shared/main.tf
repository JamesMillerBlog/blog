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

  # Partial backend config — bucket and region come from vars/backend.hcl.
  # Init: terraform init -backend-config=../../vars/backend.hcl
  backend "s3" {
    key = "shared/terraform.tfstate"
  }
}

provider "aws" {
  region = var.region
}

provider "cloudflare" {
  # API token read from CLOUDFLARE_API_TOKEN env var
}

module "github_oidc_provider" {
  source = "../../modules/github_oidc_provider"

  github_oidc_thumbprint = var.github_oidc_thumbprint
}

module "asset_hosting" {
  source = "../../modules/asset_hosting"

  bucket_name           = var.assets_bucket_name
  domain_name           = var.assets_domain_name
  cloudflare_account_id = var.cloudflare_account_id
  cloudflare_zone_id    = var.cloudflare_zone_id
}

module "content_hosting" {
  source = "../../modules/content_hosting"

  bucket_name = var.posts_bucket_name
}

resource "aws_dynamodb_table" "tf_state_lock" {
  name         = "james-miller-blog-tf-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  lifecycle {
    prevent_destroy = true
  }
}
