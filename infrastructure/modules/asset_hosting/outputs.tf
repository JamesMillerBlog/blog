output "bucket_name" {
  description = "Name of the R2 bucket holding the assets"
  value       = cloudflare_r2_bucket.assets.name
}
