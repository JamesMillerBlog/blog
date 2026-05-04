stack {
  id          = "site-staging"
  name        = "Site (staging)"
  description = "Blog site — staging environment"

  after = ["/stacks/shared"]
}

generate_file "backend_generated.tf" {
  content = <<-EOT
  terraform {
    backend "s3" {
      key    = "site/staging/terraform.tfstate"
      region = "eu-west-2"
    }
  }
  EOT
}
