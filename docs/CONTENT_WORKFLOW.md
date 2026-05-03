# Content Workflow

This document is the quickest way to re-orient yourself to how blog content flows through the system.

## Source of Truth

Blog posts live in a separate content repo (not this one). That repo owns:

* `posts/`
* `scripts/sync.sh`
* `.github/workflows/publish-posts.yml`

This repo owns:

* the Next.js app
* the Terraform infrastructure
* the local dev helper `./scripts/pull-posts.sh`

## Content Publishing Flow

1. Edit or add posts in the content repo.
2. Push to `main` in the content repo.
3. `publish-posts.yml` syncs `posts/` to the shared posts S3 bucket.
4. That workflow dispatches this repo's `content-deploy.yml` with the target environment.
5. `content-deploy.yml` triggers `deploy-site.yml` for each environment in `client_payload.environment`.
6. The app rebuild reads posts from S3 and republishes the static site.

## Environment Support

* **Staging**: Shows draft posts (where `post.draft === true`)
* **Production**: Only shows published posts (where `post.draft === false`)

## Local Development Flow

If you want to run the blog app locally with post content:

```bash
export POSTS_S3_BUCKET="<your-posts-bucket-name>"
./scripts/pull-posts.sh ./web/_posts
cd web
pnpm dev
```

`web/_posts` is gitignored and is only a local cache for development.

## Required Setup

### This repo — GitHub Environment secrets

* `R2_ACCESS_KEY_ID` — Cloudflare R2 API key ID
* `R2_SECRET_ACCESS_KEY` — Cloudflare R2 API secret
* `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID
* `CLOUDFLARE_API_TOKEN` — Cloudflare API token (cache purge permission)

### This repo — GitHub Environment variables

* `AWS_DEPLOY_ROLE_ARN` — IAM role ARN for site deployments
* `BLOG_R2_BUCKET` — R2 bucket name for the environment (staging or production)
* `POSTS_S3_BUCKET` — S3 bucket name for MDX post content
* `CLOUDFLARE_ZONE_ID` — Cloudflare zone ID

### Content repo — GitHub secrets

* `AWS_DEPLOY_ROLE_ARN`
* `POSTS_S3_BUCKET`
* `BLOG_REPO_DISPATCH_TOKEN`

### Content repo — GitHub variables

* `BLOG_REPO_OWNER`
* `BLOG_REPO_NAME`

## Testing Checklist

1. Apply Terraform for `shared`.
2. Apply Terraform for `site` with `vars/site/staging.tfvars` and `vars/site/production.tfvars`.
3. Verify the GitHub secrets/variables in both repos.
4. Run one manual `publish-posts.yml` in the content repo.
5. Confirm it triggers `deploy-site.yml` here for staging and production.
6. Open the live site and check a few posts, cover images, and inline images.
