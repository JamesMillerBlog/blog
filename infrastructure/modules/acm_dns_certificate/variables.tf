variable "domain_name" {
  type        = string
  description = "Domain name for the ACM certificate"
}

variable "hosted_zone_id" {
  type        = string
  description = "Route53 hosted zone used for DNS validation"
}
