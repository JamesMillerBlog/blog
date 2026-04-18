variable "zone_id" {
  type        = string
  description = "Route53 hosted zone ID for the alias record"
}

variable "name" {
  type        = string
  description = "DNS record name"
}

variable "target_domain_name" {
  type        = string
  description = "Alias target DNS name"
}

variable "target_zone_id" {
  type        = string
  description = "Alias target hosted zone ID"
}
