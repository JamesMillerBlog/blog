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

module "github_oidc_provider" {
  source = "../../modules/github_oidc_provider"

  github_oidc_thumbprint = var.github_oidc_thumbprint
}

# Dedicated role for content repo workflows that invoke Claude via Bedrock.
# Kept in shared (not site/staging or site/production) because it has no
# environment-specific behaviour — same trust and same Bedrock permissions regardless.
resource "aws_iam_role" "github_actions_content_claude" {
  name = "github-actions-content-claude-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRoleWithWebIdentity"
      Effect    = "Allow"
      Principal = { Federated = module.github_oidc_provider.oidc_provider_arn }
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.content_github_repo}:ref:refs/heads/*"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "content_claude_policy" {
  name = "github-actions-content-claude-policy"
  role = aws_iam_role.github_actions_content_claude.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "BedrockClaudeAccess"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ]
        # Cross-region inference profiles route eu-west-2 calls through us-east-1/us-west-2.
        # Pin to explicit versioned model IDs — update here when upgrading models.
        # Include both foundation-model ARNs and inference-profile ARNs (required for cross-region profiles).
        Resource = [
          "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
          "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0",
          "arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
          "arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0",
          "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-6",
          "arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-sonnet-4-6",
          "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0",
          "arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-haiku-4-5-20251001-v1:0",
          "arn:aws:bedrock:us-east-1:*:inference-profile/us.anthropic.claude-sonnet-4-6",
          "arn:aws:bedrock:us-west-2:*:inference-profile/us.anthropic.claude-sonnet-4-6",
          "arn:aws:bedrock:us-east-1:*:inference-profile/us.anthropic.claude-haiku-4-5-20251001-v1:0",
          "arn:aws:bedrock:us-west-2:*:inference-profile/us.anthropic.claude-haiku-4-5-20251001-v1:0",
        ]
      },
    ]
  })
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
