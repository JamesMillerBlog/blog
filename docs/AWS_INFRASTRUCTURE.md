# Infrastructure & Deployment Guide

This document outlines the architecture, Terraform layout, and deployment workflows for this blog.

## 1. Architecture Overview

The blog uses a fully serverless, statically hosted architecture split into shared resources and environment-specific infrastructure:

* **Blog (`jamesmiller.blog` / `staging.jamesmiller.blog`):** Next.js static export served from environment-specific Cloudflare R2 buckets with custom domains.
* **Assets (`assets.jamesmiller.blog`):** Shared R2 bucket and Cloudflare CDN for images and heavy media.
* **Content (`posts.jamesmiller.blog`):** Shared S3 bucket for MDX blog post files, read at build time.

## 2. Terraform Layout

Terraform is organized around:

* `infrastructure/modules`: reusable building blocks
* `infrastructure/vars`: checked-in deployment inputs
* `infrastructure/stacks`: deployable root modules / states

### Directory Structure

```text
infrastructure/
├── modules/
│   ├── acm_dns_certificate/
│   ├── route53_alias_record/
│   ├── static_hosting/
│   ├── asset_hosting/
│   ├── content_hosting/
│   ├── github_oidc_provider/
│   └── github_actions_roles/
├── vars/
│   ├── site/
│   │   ├── production.tfvars
│   │   └── staging.tfvars
│   ├── shared/
│   │   └── shared.tfvars
│   ├── backend.hcl          # gitignored — contains state bucket name
│   └── backend.hcl.example
└── stacks/
    ├── shared/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── site/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

`shared` owns the assets/posts infrastructure and the GitHub OIDC provider.

`site` owns the environment-specific blog site infrastructure and environment-scoped IAM roles.

The `site` stack reads outputs from `shared` via `terraform_remote_state`, so `shared` must be applied first.

## 3. Running Locally

Use the convenience scripts in `package.json`:

```bash
# Shared stack (assets, posts bucket, OIDC provider)
pnpm tf:shared:init
pnpm tf:shared:plan
pnpm tf:shared:apply

# Site stack — staging
pnpm tf:staging:init
pnpm tf:staging:plan
pnpm tf:staging:apply

# Site stack — production
pnpm tf:production:init
pnpm tf:production:plan
pnpm tf:production:apply
```

Bootstrap note:

* The first-ever `shared` apply creates the GitHub OIDC provider.
* That initial bootstrap must be run manually with AWS credentials that already have IAM permissions.

## 4. Content Repository Model

Blog posts live in a separate content repo. That repo is the source of truth for content and owns:

* the `posts/` directory
* the post-to-S3 sync script
* the content publishing workflow

This repo:

* consumes the shared posts bucket during builds
* optionally pulls posts locally into the ignored `web/_posts/` directory for development

## 5. Application Configuration

The Next.js app in `web/` is configured for static export:

* `next.config.ts` uses `output: 'export'` and `trailingSlash: true`
* `web/src/lib/imageLoader.ts` rewrites local image paths to the assets CDN
* `web/src/common/utils/posts.ts` reads MDX content from the shared posts S3 bucket during build
* when `POSTS_BUCKET` is not set, the app falls back to local files in `web/_posts/`

For local development, pull posts into `web/_posts/` with:

```bash
export POSTS_S3_BUCKET="<your-posts-bucket-name>"
./scripts/pull-posts.sh ./web/_posts
```

## 6. CI/CD Workflows

### `deploy-site.yml`

* Triggers on pushes to `main` that touch `web/`, or manually via `workflow_dispatch`
* Builds the static site, reading posts from the shared posts S3 bucket
* Syncs the output to the environment's R2 bucket with appropriate cache headers
* Purges the Cloudflare zone cache after each deploy
* Supports both `production` and `staging` environments

The separate content repo triggers this workflow after syncing posts to S3.

## 7. Scripts

Asset scripts:

* `./scripts/upload-assets.sh <local-directory> [r2-prefix]` — sync local files to the assets R2 bucket
* `./scripts/purge-assets.sh [path-pattern]` — purge assets from the Cloudflare CDN cache
* `./scripts/list-assets.sh [r2-prefix]` — list objects in the assets R2 bucket

Local dev content script:

* `./scripts/pull-posts.sh [local-path]` — pull posts from S3 into `web/_posts/` for local development
