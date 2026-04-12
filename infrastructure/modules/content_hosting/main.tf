# Shared post content hosting.
# This module owns the posts bucket only — no CloudFront.
# Posts are fetched at build time via the AWS SDK (server-side), not served over HTTP.

resource "aws_s3_bucket" "content" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "content" {
  bucket = aws_s3_bucket.content.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "content" {
  bucket = aws_s3_bucket.content.id

  versioning_configuration {
    status = "Enabled"
  }
}
