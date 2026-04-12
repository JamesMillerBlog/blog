output "bucket_name" {
  description = "Name of the R2 bucket holding the static site files"
  value       = cloudflare_r2_bucket.site.name
}
