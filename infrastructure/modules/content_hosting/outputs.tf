output "bucket_name" {
  description = "Name of the S3 bucket used to store MDX posts"
  value       = aws_s3_bucket.content.bucket
}

output "bucket_arn" {
  description = "ARN of the content S3 bucket"
  value       = aws_s3_bucket.content.arn
}
