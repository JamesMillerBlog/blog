# Register GitHub Actions as a trusted OIDC identity provider in this AWS account.
# This is account-wide infrastructure and must be managed from the shared stack.

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [var.github_oidc_thumbprint]

  lifecycle {
    prevent_destroy = true
  }
}
