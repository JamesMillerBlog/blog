terraform {
  required_version = ">= 1.5.0"

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

  # Partial backend config — bucket and region come from vars/backend.hcl,
  # key is passed per-environment at init time.
  # Init: terraform init -backend-config=../../vars/backend.hcl \
  #                      -backend-config="key=site/production/terraform.tfstate"
  backend "s3" {}
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
  source = "../../modules/static_hosting"

  bucket_name           = var.bucket_name
  domain_name           = var.domain_name
  cloudflare_account_id = var.cloudflare_account_id
  cloudflare_zone_id    = var.cloudflare_zone_id
}

module "github_actions_roles" {
  source = "../../modules/github_actions_roles"

  environment       = var.environment
  github_repo       = var.github_repo
  oidc_provider_arn = data.terraform_remote_state.shared.outputs.oidc_provider_arn
  deploy_bucket_arns = [
    data.terraform_remote_state.shared.outputs.posts_bucket_arn,
  ]
}
