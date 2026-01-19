# Feature: Analytics Dashboard

Add a comprehensive analytics dashboard to the URL shortener that provides detailed insights into link performance. This feature tracks click events with metadata and displays them through interactive charts and filters.

## Overview

The current system only tracks a simple `clickCount` integer. This feature adds:

1. Detailed click event logging (timestamp, user agent, referrer, geographic data)
2. A new DynamoDB table for analytics events
3. New API endpoints for fetching analytics data
4. A frontend analytics page with interactive charts
5. Filtering capabilities by date range, URL, and dimensions

## Backend Requirements

### New DynamoDB Table: Analytics Events

Create a new DynamoDB table `url-shortener-analytics-{stack}` with the following schema:

```
Primary Key:
- Partition Key: shortCode (String)
- Sort Key: timestamp (String, ISO 8601 format)

Attributes:
- shortCode: String (the short URL code)
- timestamp: String (ISO 8601, e.g., "2026-01-20T14:30:00.000Z")
- userAgent: String (raw user agent string)
- browser: String (parsed browser name: Chrome, Firefox, Safari, Edge, Other)
- browserVersion: String (major version number)
- os: String (parsed OS: Windows, macOS, Linux, iOS, Android, Other)
- deviceType: String (Desktop, Mobile, Tablet)
- referrer: String (the referring URL, or "Direct" if none)
- referrerDomain: String (extracted domain from referrer)
- country: String (2-letter country code from CloudFront-Viewer-Country header)
- region: String (region code from CloudFront-Viewer-Country-Region header)
- city: String (city from CloudFront-Viewer-City header, URL-decoded)
```

Add a Global Secondary Index (GSI) for querying by date:
- GSI Name: `by-date`
- Partition Key: shortCode
- Sort Key: timestamp
- Projection: ALL

### Update redirect.ts Lambda

Modify the redirect Lambda to log analytics events. Extract the following from the request:

```typescript
// Headers to extract (API Gateway passes these from CloudFront)
const userAgent = event.headers['User-Agent'] || event.headers['user-agent'] || '';
const referrer = event.headers['Referer'] || event.headers['referer'] || 'Direct';
const country = event.headers['CloudFront-Viewer-Country'] || 'Unknown';
const region = event.headers['CloudFront-Viewer-Country-Region'] || '';
const city = event.headers['CloudFront-Viewer-City'] || '';

// Parse user agent to extract browser, OS, device type
// Use a lightweight parser or simple regex patterns
```

After the redirect, asynchronously write to the analytics table (don't block the redirect response).

### New Lambda: analytics.ts

Create `lambda/analytics.ts` that handles:

**GET /api/analytics/{shortCode}**

Query parameters:
- `from`: ISO 8601 start date (default: 7 days ago)
- `to`: ISO 8601 end date (default: now)
- `granularity`: `hour`, `day`, `week` (default: `day`)

Response:
```json
{
  "shortCode": "abc123",
  "originalUrl": "https://example.com/long-url",
  "totalClicks": 1547,
  "uniqueCountries": 12,
  "period": {
    "from": "2026-01-13T00:00:00.000Z",
    "to": "2026-01-20T23:59:59.999Z"
  },
  "timeline": [
    { "date": "2026-01-13", "clicks": 142 },
    { "date": "2026-01-14", "clicks": 198 },
    { "date": "2026-01-15", "clicks": 267 }
  ],
  "browsers": [
    { "name": "Chrome", "clicks": 892, "percentage": 57.7 },
    { "name": "Safari", "clicks": 341, "percentage": 22.0 },
    { "name": "Firefox", "clicks": 187, "percentage": 12.1 },
    { "name": "Edge", "clicks": 89, "percentage": 5.8 },
    { "name": "Other", "clicks": 38, "percentage": 2.4 }
  ],
  "devices": [
    { "type": "Desktop", "clicks": 987, "percentage": 63.8 },
    { "type": "Mobile", "clicks": 498, "percentage": 32.2 },
    { "type": "Tablet", "clicks": 62, "percentage": 4.0 }
  ],
  "countries": [
    { "code": "US", "name": "United States", "clicks": 634, "percentage": 41.0 },
    { "code": "GB", "name": "United Kingdom", "clicks": 198, "percentage": 12.8 },
    { "code": "DE", "name": "Germany", "clicks": 156, "percentage": 10.1 },
    { "code": "FR", "name": "France", "clicks": 112, "percentage": 7.2 }
  ],
  "referrers": [
    { "domain": "twitter.com", "clicks": 423, "percentage": 27.3 },
    { "domain": "Direct", "clicks": 387, "percentage": 25.0 },
    { "domain": "linkedin.com", "clicks": 234, "percentage": 15.1 },
    { "domain": "google.com", "clicks": 198, "percentage": 12.8 }
  ],
  "topCities": [
    { "city": "San Francisco", "country": "US", "clicks": 89 },
    { "city": "London", "country": "GB", "clicks": 76 },
    { "city": "New York", "country": "US", "clicks": 71 }
  ]
}
```

**GET /api/analytics/overview**

Returns aggregated analytics across all URLs for the authenticated user.

Query parameters:
- `from`: ISO 8601 start date
- `to`: ISO 8601 end date
- `limit`: Number of top URLs to return (default: 10)

Response:
```json
{
  "totalClicks": 15234,
  "totalUrls": 47,
  "period": {
    "from": "2026-01-13T00:00:00.000Z",
    "to": "2026-01-20T23:59:59.999Z"
  },
  "timeline": [
    { "date": "2026-01-13", "clicks": 1892 },
    { "date": "2026-01-14", "clicks": 2134 }
  ],
  "topUrls": [
    { "shortCode": "abc123", "originalUrl": "https://...", "clicks": 1547 },
    { "shortCode": "xyz789", "originalUrl": "https://...", "clicks": 1203 }
  ],
  "browsers": [...],
  "devices": [...],
  "countries": [...]
}
```

### API Gateway Updates

Add the following routes to API Gateway:

- `GET /api/analytics/{shortCode}` -> analyticsFunction
- `GET /api/analytics/overview` -> analyticsFunction

Update the CloudFront behavior for `/api/*` to forward the geographic headers:
- `CloudFront-Viewer-Country`
- `CloudFront-Viewer-Country-Region`
- `CloudFront-Viewer-City`

### IAM Policy Updates

Update the Lambda IAM policy to allow:
- Read/Write to the new analytics table
- Read from the existing URLs table

## Frontend Requirements

### New Page: Analytics.tsx

Create `frontend/src/pages/Analytics.tsx` with the following sections:

#### Header Section
- Page title: "Analytics"
- Date range picker (preset options: Last 7 days, Last 30 days, Last 90 days, Custom)
- URL selector dropdown (if viewing specific URL analytics)
- Export button (CSV download)

#### Overview Cards Row
Display 4 metric cards:
1. **Total Clicks** - Large number with sparkline showing trend
2. **Unique Countries** - Number with small world map icon
3. **Top Browser** - Browser name with percentage
4. **Top Device** - Device type with percentage

#### Timeline Chart Section
- Line chart showing clicks over time
- X-axis: dates (responsive to granularity)
- Y-axis: click count
- Hover tooltips showing exact values
- Use a charting library (Recharts or Chart.js)

#### Breakdown Charts Row (2 columns)

**Left Column: Geographic Distribution**
- Interactive world map showing click density by country (use a simple SVG map)
- Below the map: scrollable table of countries sorted by clicks
- Columns: Country flag emoji, Country name, Clicks, Percentage bar

**Right Column: Browser & Device**
- Donut chart showing browser distribution
- Legend with browser names and percentages
- Below: horizontal bar chart showing device type breakdown

#### Referrer Sources Section
- Horizontal bar chart showing top referrers
- Each bar shows: favicon (if possible), domain name, click count, percentage
- "Direct" traffic shown with a special icon
- Limit to top 10, with "Show more" expansion

#### Top Cities Table
- Sortable table with columns: City, Country, Clicks
- Pagination for many cities
- Search/filter by city name

### Design Requirements

- Match existing dashboard styling (colors, fonts, spacing)
- Dark mode support
- Responsive layout:
  - Desktop: 2-column layout for charts
  - Tablet: Single column, charts stack
  - Mobile: Compact cards, simplified charts
- Loading states with skeleton placeholders
- Empty states when no data available
- Error states with retry option

### Chart Styling
- Use consistent color palette across all charts
- Primary color for main metrics
- Muted colors for secondary data
- Accessible color contrast (WCAG AA)
- Smooth animations on data load

### Navigation Updates

Update `frontend/src/components/Navbar.tsx`:
- Add "Analytics" link between "Dashboard" and "Docs"
- Route: `/analytics`

Update `frontend/src/App.tsx`:
- Add route for `/analytics` -> Analytics page
- Add route for `/analytics/:shortCode` -> Analytics page with specific URL

### Dashboard Integration

Update `frontend/src/pages/Dashboard.tsx`:
- Add "View Analytics" button/link for each URL row
- Links to `/analytics/{shortCode}`
- Show mini sparkline of recent clicks if space allows

## Testing Requirements

See `e2e.md` for end-to-end test cases covering:
- Analytics page navigation and loading
- Chart rendering verification
- Date filter functionality
- URL-specific analytics view
- Responsive design testing

## Success Criteria

1. `pulumi preview` shows the new analytics table and Lambda resources
2. `pulumi up` deploys successfully without errors
3. All existing E2E tests still pass
4. New analytics E2E tests pass (see `e2e.md`)
5. Analytics data is being logged on redirects
6. Charts render with real data after generating test clicks

## End-to-End Verification

After deployment, use the `/agent-browser` skill to verify the analytics feature works.

Run these tests from `e2e.md`:
- Test 9: Analytics Page Navigation
- Test 10: Analytics Overview Loads
- Test 12: URL-Specific Analytics
- Test 13: Analytics Charts Render
- Test 16: Generate Test Clicks for Analytics

Only consider the feature complete when verification confirms:
1. Analytics link appears in navigation
2. Analytics page loads without errors
3. Charts render (timeline, browser, device, geographic)
4. URL-specific analytics work from dashboard
5. Click data appears after generating test clicks

## Technical Notes

### User Agent Parsing

For parsing user agent strings, use simple regex patterns rather than a heavy library:

```typescript
function parseUserAgent(ua: string): { browser: string; os: string; deviceType: string } {
  // Browser detection
  let browser = 'Other';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  // OS detection
  let os = 'Other';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';

  // Device type detection
  let deviceType = 'Desktop';
  if (ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android')) {
    deviceType = ua.includes('Tablet') || ua.includes('iPad') ? 'Tablet' : 'Mobile';
  }

  return { browser, os, deviceType };
}
```

### Country Code to Name Mapping

Include a small mapping for common country codes to display names. This keeps the Lambda lightweight while providing readable country names in the response.

### Async Analytics Logging

Use `Promise.allSettled` to log analytics without blocking the redirect response:

```typescript
// Don't await - let it run in background
docClient.send(new PutCommand({...})).catch(err => console.error('Analytics log failed:', err));

// Return redirect immediately
return { statusCode: 301, headers: { Location: originalUrl }, body: '' };
```

## File Structure After Implementation

```
lambda/
  analytics.ts        # NEW: Analytics query handler
  redirect.ts         # MODIFIED: Add analytics logging
  ... (existing files)

frontend/src/
  pages/
    Analytics.tsx     # NEW: Analytics dashboard page
    Analytics.module.css  # NEW: Analytics page styles
    ... (existing files)
  components/
    Navbar.tsx        # MODIFIED: Add Analytics link
  App.tsx             # MODIFIED: Add /analytics routes

index.ts              # MODIFIED: Add analytics table, Lambda, API routes
```
Only output <promise>COMPLETE</promise> after ALL of the above pass.