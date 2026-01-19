# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

URL Shortener SaaS - a serverless application with React frontend, AWS Lambda backend, and Pulumi infrastructure-as-code. Deployed to AWS with CloudFront CDN.

## Build & Deploy Commands

```bash
# Install all dependencies
npm install && cd frontend && npm install && cd ../lambda && npm install && cd ..

# Build frontend (required before deployment)
cd frontend && npm run build && cd ..

# Build Lambda functions (required before deployment)
cd lambda && npm run build && cd ..

# Deploy infrastructure
pulumi up

# Destroy all resources
pulumi destroy
```

## Development Commands

```bash
# Frontend dev server with hot reload
cd frontend && npm run dev

# Frontend linting
cd frontend && npm run lint

# Lambda tests
cd lambda && npm test

# Lambda test coverage
cd lambda && npm run test:coverage

# Build individual Lambda function
cd lambda && npm run build:shorten   # or :redirect, :stats, :list, :delete, :analytics
```

## Architecture

### Infrastructure (Pulumi - `index.ts`)

All AWS resources defined in a single Pulumi program:
- **DynamoDB**: Two tables - `url-shortener-urls-{stack}` (shortCode partition key) and `url-shortener-analytics-{stack}` (shortCode + timestamp keys with GSI)
- **Lambda**: Six Node.js 20 functions (256MB, 30s timeout) with environment variables `TABLE_NAME` and `ANALYTICS_TABLE_NAME`
- **API Gateway**: REST API at `/api/*` with CORS enabled
- **CloudFront**: Two origins - S3 for static frontend, API Gateway for `/api/*` routes (no caching on API)

### Lambda Functions (`lambda/`)

Each endpoint has its own handler file compiled separately with esbuild:
- `shorten.ts` - POST /api/shorten - creates short URLs
- `redirect.ts` - GET /api/{shortCode} - 301 redirect with async analytics tracking
- `stats.ts` - GET /api/stats/{shortCode} - URL statistics
- `list.ts` - GET /api/urls - list all URLs
- `delete.ts` - DELETE /api/{shortCode} - delete URL
- `analytics.ts` - GET /api/analytics/overview and /api/analytics/{shortCode}

Shared utilities in `utils.ts`: short code generation, URL validation, CORS headers.

### Frontend (`frontend/`)

React 19 SPA with Vite:
- `src/pages/` - Landing, Dashboard, Analytics, Docs pages
- `src/components/` - Header (with theme toggle), Footer
- `src/utils/api.ts` - Centralized API client with TypeScript interfaces

Routes: `/` (landing), `/dashboard`, `/analytics`, `/analytics/:shortCode`, `/docs`

### Data Flow

1. CloudFront receives all requests
2. Static assets served from S3 (1hr cache)
3. `/api/*` routes proxied to API Gateway (no cache)
4. Lambda functions read/write DynamoDB
5. Analytics tracked asynchronously on redirects (doesn't block 301)

## Testing

Lambda tests use Jest with ts-jest. Run from `lambda/` directory:
```bash
npm test                    # Run all tests
npm run test:coverage       # With coverage report
```

E2E tests defined in `e2e.md` - 18 manual test scenarios using `agent-browser` CLI tool against the deployed CloudFront URL.

## Build Order

Frontend and Lambda must be built before `pulumi up`:
1. `frontend/dist/` - uploaded to S3 bucket
2. `lambda/dist/*.js` - deployed to Lambda functions

## Key Configuration

- **Pulumi.dev.yaml**: us-east-1 region, pulumi-idp/auth ESC environment
- **TypeScript**: Strict mode enabled in all packages
- **Lambda externals**: `@aws-sdk/*` excluded from bundle (provided by runtime)
