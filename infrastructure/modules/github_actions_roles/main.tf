locals {
  # Restricts infra role (AdministratorAccess) to branch refs and named environments
  # within this repo only. infra-deploy.yml jobs specify `environment:`, which changes
  # the sub claim from "ref:refs/heads/…" to "environment:<name>", so both patterns
  # are required. Fork pull requests use "pull_request" and match neither.
  oidc_assume_condition_infra = {
    StringEquals = {
      "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
    }
    StringLike = {
      "token.actions.githubusercontent.com:sub" = [
        "repo:${var.github_repo}:ref:refs/heads/*",
        "repo:${var.github_repo}:environment:*",
      ]
    }
  }

  # Deploy role is assumed by workflow_dispatch runs. When a job specifies
  # `environment:`, GitHub changes the sub claim from "ref:refs/heads/…" to
  # "environment:<name>", so both patterns must be allowed. Fork pull requests
  # use "pull_request" in the sub and match neither pattern, so they are blocked.
  oidc_assume_condition_deploy = {
    StringEquals = {
      "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
    }
    StringLike = {
      "token.actions.githubusercontent.com:sub" = [
        "repo:${var.github_repo}:ref:refs/heads/*",
        "repo:${var.github_repo}:environment:*",
      ]
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

