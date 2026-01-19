# URL Shortener SaaS

A production-ready URL Shortener SaaS built with Pulumi TypeScript, AWS Lambda, DynamoDB, API Gateway, CloudFront, and React.

## Live Demo

**CloudFront URL**: https://d1232drths1aav.cloudfront.net

## Features

- **URL Shortening**: Create short URLs with auto-generated or custom aliases
- **Click Tracking**: Real-time analytics for each shortened URL
- **Modern Frontend**: React SPA with responsive design and dark mode support
- **Serverless Backend**: AWS Lambda functions with DynamoDB storage
- **Global CDN**: CloudFront distribution for fast, secure access worldwide

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CloudFront    │────▶│   S3 Bucket     │     │   DynamoDB      │
│   Distribution  │     │   (Frontend)    │     │   Table         │
└────────┬────────┘     └─────────────────┘     └────────▲────────┘
         │                                               │
         │ /api/*                                        │
         ▼                                               │
┌─────────────────┐     ┌─────────────────┐             │
│   API Gateway   │────▶│ Lambda Functions│─────────────┘
│   REST API      │     │ (Node.js 20)    │
└─────────────────┘     └─────────────────┘
```

## Tech Stack

### Infrastructure (Pulumi TypeScript)
- AWS DynamoDB (PAY_PER_REQUEST billing)
- AWS Lambda (Node.js 20 runtime)
- AWS API Gateway (REST API with CORS)
- AWS S3 (Static website hosting)
- AWS CloudFront (HTTPS CDN)
- Pulumi ESC for secrets management

### Frontend (React + Vite)
- React 18 with TypeScript
- React Router for navigation
- Framer Motion for animations
- CSS Modules for styling
- Responsive design with dark mode

### Backend (AWS Lambda)
- TypeScript compiled with esbuild
- AWS SDK v3 for DynamoDB
- RESTful API design

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/shorten | Create a short URL |
| GET | /api/{shortCode} | Redirect to original URL (301) |
| GET | /api/stats/{shortCode} | Get URL statistics |
| GET | /api/urls | List all URLs |
| DELETE | /api/{shortCode} | Delete a URL |

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Pulumi CLI](https://www.pulumi.com/docs/get-started/install/) >= 3
- AWS credentials configured

## Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dirien/url-shortener-saas.git
   cd url-shortener-saas
   ```

2. **Install dependencies**:
   ```bash
   npm install
   cd frontend && npm install && cd ..
   cd lambda && npm install && cd ..
   ```

3. **Build the frontend**:
   ```bash
   cd frontend && npm run build && cd ..
   ```

4. **Build Lambda functions**:
   ```bash
   cd lambda && npm run build && cd ..
   ```

5. **Deploy with Pulumi**:
   ```bash
   pulumi up
   ```

## Testing

### Unit & Integration Tests
```bash
cd lambda && npm test
```

### Test Coverage
```bash
cd lambda && npm run test:coverage
```

### E2E Tests

E2E tests are defined in `e2e.md` and can be run using the `agent-browser` CLI tool:

```bash
# Install agent-browser
npm install -g agent-browser

# Run tests manually following prompts in e2e.md
agent-browser open https://d1232drths1aav.cloudfront.net
agent-browser snapshot -i
# ... follow test steps
```

## Project Structure

```
url-shortener/
├── index.ts              # Pulumi infrastructure code
├── Pulumi.yaml           # Pulumi project configuration
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── pages/        # Landing, Dashboard, Docs pages
│   │   ├── components/   # Header, Footer components
│   │   ├── utils/        # API client
│   │   └── index.css     # Global styles
│   └── package.json
├── lambda/               # AWS Lambda functions
│   ├── shorten.ts        # Create short URL
│   ├── redirect.ts       # Redirect handler
│   ├── stats.ts          # Get URL statistics
│   ├── list.ts           # List all URLs
│   ├── delete.ts         # Delete URL
│   ├── utils.ts          # Shared utilities
│   ├── utils.test.ts     # Unit tests
│   ├── handlers.test.ts  # Integration tests
│   ├── dist/             # Compiled JavaScript (generated)
│   └── package.json
├── e2e.md                # E2E test prompts
├── screenshots/          # E2E test screenshots
└── package.json
```

## Cleanup

To destroy all AWS resources:
```bash
pulumi destroy
```

## License

MIT