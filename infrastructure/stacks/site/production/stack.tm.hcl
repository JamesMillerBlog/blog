stack {
  id          = "site-production"
  name        = "Site (production)"
  description = "Blog site — production environment"

  after = ["/stacks/shared"]
}

generate_file "backend_generated.tf" {
  content = <<-EOT
  terraform {
    backend "s3" {
      key    = "site/production/terraform.tfstate"
      region = "eu-west-2"
    }
  }
  EOT
}
