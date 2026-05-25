variable "pr_number" {
  type        = number
  description = "Pull request number"
}

variable "cloudflare_account_id" {
  type        = string
  description = "Cloudflare account ID"
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Cloudflare zone ID"
}

variable "basic_auth_username" {
  type        = string
  description = "Basic Auth username"
  sensitive   = true
}

variable "basic_auth_password" {
  type        = string
  description = "Basic Auth password"
  sensitive   = true
}
