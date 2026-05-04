terraform {
  backend "s3" {
    key    = "site/production/terraform.tfstate"
    region = "eu-west-2"
  }
}
