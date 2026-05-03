locals {
  # Restricts infra role (AdministratorAccess) to branch refs within this repo only.
  # Blocks fork pull requests (their sub uses "pull_request", not "ref:refs/heads/…").
  oidc_assume_condition_infra = {
    StringEquals = {
      "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
    }
    StringLike = {
      "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/*"
    }
  }

  # Deploy role is assumed by workflow_dispatch and repository_dispatch runs on
  # branch refs only. Explicitly excludes fork pull requests whose sub claim
  # uses "pull_request" rather than "ref:refs/heads/…".
  oidc_assume_condition_deploy = {
    StringEquals = {
      "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
    }
    StringLike = {
      "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/*"
    }
  }

  deploy_object_arns = [for bucket_arn in var.deploy_bucket_arns : "${bucket_arn}/*"]
}

resource "aws_iam_role" "github_actions_infra" {
  name = "github-actions-${var.environment}-infra-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRoleWithWebIdentity"
      Effect    = "Allow"
      Principal = { Federated = var.oidc_provider_arn }
      Condition = local.oidc_assume_condition_infra
    }]
  })
}

# AdministratorAccess is intentionally broad for a personal blog — it allows
# Terraform to manage any AWS resource without maintaining a bespoke policy.
# SECURITY SIGN-OFF REQUIRED: this grants full AWS admin to any branch push on
# this repo. Acceptable given single-owner scope, but must be reviewed if the
# repo ever gets external contributors or the OIDC trust policy changes.
resource "aws_iam_role_policy_attachment" "infra_admin" {
  role       = aws_iam_role.github_actions_infra.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_role" "github_actions_deploy" {
  name = "github-actions-${var.environment}-deploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRoleWithWebIdentity"
      Effect    = "Allow"
      Principal = { Federated = var.oidc_provider_arn }
      Condition = local.oidc_assume_condition_deploy
    }]
  })
}

resource "aws_iam_role_policy" "deploy_policy" {
  name = "github-actions-${var.environment}-deploy-policy"
  role = aws_iam_role.github_actions_deploy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ListBuckets"
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = var.deploy_bucket_arns
      },
      {
        Sid      = "ManageObjects"
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = local.deploy_object_arns
      },
    ]
  })
}

# Dedicated role for workflows that invoke Claude via Bedrock.
# Kept separate from the deploy role so S3 deployments never carry model access.
resource "aws_iam_role" "github_actions_claude" {
  name = "github-actions-${var.environment}-claude-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRoleWithWebIdentity"
      Effect    = "Allow"
      Principal = { Federated = var.oidc_provider_arn }
      Condition = local.oidc_assume_condition_deploy
    }]
  })
}

resource "aws_iam_role_policy" "claude_policy" {
  name = "github-actions-${var.environment}-claude-policy"
  role = aws_iam_role.github_actions_claude.id

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
        Resource = [
          "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
          "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0",
          "arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
          "arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0",
        ]
      },
    ]
  })
}
