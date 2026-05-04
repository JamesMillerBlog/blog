stack {
  id          = "shared"
  name        = "Shared"
  description = "Shared infrastructure"
}

generate_file "backend_generated.tf" {
  content = <<-EOT
  terraform {
    backend "s3" {
      key    = "shared/terraform.tfstate"
      region = "eu-west-2"
    }
  }
  EOT
}
