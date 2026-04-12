locals {
  oidc_assume_condition = {
    StringEquals = {
      "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
    }
    StringLike = {
      "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:*"
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
      Condition = local.oidc_assume_condition
    }]
  })
}

# AdministratorAccess is intentionally broad for a personal blog — it allows
# Terraform to manage any AWS resource without maintaining a bespoke policy.
# Acceptable trade-off given the scope, but the OIDC trust policy above limits
# this to GitHub Actions runs on this specific repo only.
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
      Condition = local.oidc_assume_condition
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
