terraform {
  backend "s3" {
    key    = "shared/terraform.tfstate"
    region = "eu-west-2"
  }
}
