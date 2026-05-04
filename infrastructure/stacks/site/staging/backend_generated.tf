terraform {
  backend "s3" {
    key    = "site/staging/terraform.tfstate"
    region = "eu-west-2"
  }
}
