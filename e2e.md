# E2E Test Prompts for URL Shortener

Use the `/agent-browser` skill to run these tests.

## Configuration

- **CloudFront URL**: https://d1232drths1aav.cloudfront.net
- **API URL**: https://jem6p0u7al.execute-api.us-east-1.amazonaws.com/api

## Test 1: Homepage Load

```
Navigate to https://d1232drths1aav.cloudfront.net and verify the page loads correctly.
Take a screenshot and confirm:
1. The page title contains "Snip.ly" or "URL Shortener"
2. There is an input field for entering URLs
3. There is a "Shorten" button
```

## Test 2: Shorten a URL

```
Navigate to https://d1232drths1aav.cloudfront.net and:
1. Find the URL input field
2. Enter the URL: https://example.com/e2e-test-{timestamp}
3. Click the "Shorten URL" or "Create Short URL" button
4. Wait for the response
5. Take a screenshot
6. Verify a short code was generated and displayed
```

## Test 3: Dashboard View

```
Navigate to https://d1232drths1aav.cloudfront.net/dashboard and:
1. Wait for the page to load completely (networkidle)
2. Take a screenshot
3. Verify the "Your URLs" section is visible
4. Confirm at least one shortened URL is listed with:
   - A short code
   - The original URL
   - Click count
   - Creation date
```

## Test 4: API Health Check

```
Test the API directly by:
1. Navigate to any page on https://d1232drths1aav.cloudfront.net
2. Use JavaScript fetch to call GET https://d1232drths1aav.cloudfront.net/api/urls
3. Verify the response status is 200
4. Verify the response contains a "urls" array
5. Log the number of URLs returned
```

## Test 5: Full E2E Flow

```
Perform a complete end-to-end test:

1. Navigate to https://d1232drths1aav.cloudfront.net
2. Take a screenshot of the homepage
3. Find and fill the URL input with: https://playwright-test.example.com/full-e2e
4. Click the shorten/create button
5. Wait for the shortened URL to appear
6. Take a screenshot showing the result
7. Navigate to the dashboard
8. Verify the newly created URL appears in the list
9. Take a final screenshot of the dashboard
10. Report success/failure with details
```

## Test 6: Custom Alias

```
Test creating a URL with a custom alias:

1. Navigate to https://d1232drths1aav.cloudfront.net/dashboard
2. Find the "Long URL" input and enter: https://example.com/custom-alias-test
3. Find the "Custom Alias" input and enter: my-custom-link-{random}
4. Click "Create Short URL"
5. Verify the custom alias was accepted or report any error message
6. Take a screenshot of the result
```

## Test 7: URL Redirect (API)

```
Test that shortened URLs redirect correctly:

1. First, call the API to get the list of URLs:
   GET https://d1232drths1aav.cloudfront.net/api/urls
2. Pick a shortCode from the response
3. Navigate to https://d1232drths1aav.cloudfront.net/api/{shortCode}
4. Verify the page redirects to the original URL
5. Report the redirect chain
```

## Test 8: Error Handling

```
Test error handling for invalid inputs:

1. Navigate to https://d1232drths1aav.cloudfront.net
2. Try to shorten an invalid URL (e.g., "not-a-url")
3. Take a screenshot
4. Verify an appropriate error message is displayed
5. Try to shorten an empty URL
6. Verify the form validation works
```

---

## Analytics Dashboard Tests

The following tests verify the analytics dashboard feature. See `feature-prompt.md` for full feature specification.

## Test 9: Analytics Page Navigation

```
Test that the analytics page is accessible from navigation:

1. Navigate to https://d1232drths1aav.cloudfront.net
2. Find and click the "Analytics" link in the navigation bar
3. Verify the URL changed to /analytics
4. Take a screenshot
5. Verify the page title contains "Analytics"
6. Verify the date range picker is visible
7. Verify at least one chart container is visible
```

## Test 10: Analytics Overview Loads

```
Test that the analytics overview page loads with data:

1. Navigate to https://d1232drths1aav.cloudfront.net/analytics
2. Wait for the page to fully load (network idle)
3. Take a screenshot
4. Verify the following elements are present:
   - Total Clicks metric card
   - Unique Countries metric card
   - Timeline chart (line chart showing clicks over time)
   - Browser distribution chart (donut/pie chart)
   - Device breakdown chart
5. Verify no error messages are displayed
```

## Test 11: Analytics Date Filter

```
Test the date range filter functionality:

1. Navigate to https://d1232drths1aav.cloudfront.net/analytics
2. Wait for the page to load
3. Find the date range picker/selector
4. Select "Last 30 days" option
5. Wait for the charts to update (look for loading state or data change)
6. Take a screenshot
7. Verify the timeline chart X-axis shows approximately 30 data points
8. Select "Last 7 days" option
9. Verify the chart updates to show fewer data points
10. Take a screenshot
```

## Test 12: URL-Specific Analytics

```
Test viewing analytics for a specific shortened URL:

1. Navigate to https://d1232drths1aav.cloudfront.net/dashboard
2. Wait for the URL list to load
3. Find a URL row with a "View Analytics" or analytics icon button
4. Click the analytics button for that URL
5. Verify the URL changes to /analytics/{shortCode}
6. Take a screenshot
7. Verify the page shows analytics specific to that URL:
   - The short code or original URL is displayed
   - Click count is shown
   - Timeline chart reflects this specific URL's data
8. Verify a "Back to Overview" or similar navigation option exists
```

## Test 13: Analytics Charts Render

```
Test that all analytics charts render correctly:

1. Navigate to https://d1232drths1aav.cloudfront.net/analytics
2. Wait for the page to fully load
3. Verify the timeline/line chart:
   - Has visible axes (X and Y)
   - Has at least one data point or line
   - Take a screenshot of the chart area
4. Verify the browser distribution chart:
   - Is a donut or pie chart
   - Has a legend showing browser names
   - Take a screenshot
5. Verify the device breakdown:
   - Shows Desktop, Mobile, Tablet categories
   - Has percentage or count values
6. Verify the geographic section:
   - Shows country names or codes
   - Has click counts per country
   - Take a screenshot
7. Verify the referrer sources section:
   - Lists referrer domains
   - Shows "Direct" traffic category
   - Take a screenshot
```

## Test 14: Analytics Responsive Design

```
Test analytics page responsive behavior:

1. Navigate to https://d1232drths1aav.cloudfront.net/analytics
2. Wait for the page to load
3. Set viewport to desktop size (1280x800)
4. Take a screenshot
5. Verify charts are displayed in a 2-column layout
6. Set viewport to tablet size (768x1024)
7. Take a screenshot
8. Verify charts stack vertically
9. Set viewport to mobile size (375x667)
10. Take a screenshot
11. Verify:
    - Navigation collapses to hamburger menu
    - Metric cards stack vertically
    - Charts are readable at mobile width
```

## Test 15: Analytics API Direct Test

```
Test the analytics API endpoints directly:

1. Navigate to https://d1232drths1aav.cloudfront.net
2. Use JavaScript fetch to call GET /api/analytics/overview
3. Verify response status is 200
4. Verify the response contains:
   - totalClicks (number)
   - period object with from/to dates
   - timeline array
   - browsers array
   - devices array
5. Log the response summary
6. Get a shortCode from the URL list
7. Call GET /api/analytics/{shortCode}
8. Verify response status is 200
9. Verify response contains shortCode-specific data
```

## Test 16: Generate Test Clicks for Analytics

```
Prerequisite test to generate analytics data:

1. Navigate to https://d1232drths1aav.cloudfront.net/dashboard
2. Create a new short URL with a unique alias (e.g., "analytics-test-{timestamp}")
3. Note the short code returned
4. Open the short URL 5 times in sequence:
   - Visit https://d1232drths1aav.cloudfront.net/api/{shortCode}
   - Wait for redirect to complete
   - Repeat 4 more times
5. Navigate to /analytics/{shortCode}
6. Verify the click count shows at least 5 clicks
7. Verify the timeline chart shows today's date with clicks
8. Take a screenshot as proof
```

## Test 17: Analytics Empty State

```
Test analytics display when no data is available:

1. Navigate to https://d1232drths1aav.cloudfront.net/dashboard
2. Create a brand new short URL with unique alias
3. Immediately navigate to /analytics/{newShortCode}
4. Verify the page handles the empty/zero state gracefully:
   - Shows "No data yet" or similar message
   - Charts display empty state (not broken)
   - Total clicks shows 0
5. Take a screenshot
6. Verify no JavaScript errors in console
```

## Test 18: Analytics Dark Mode

```
Test analytics page in dark mode:

1. Navigate to https://d1232drths1aav.cloudfront.net/analytics
2. Wait for the page to load
3. Find and click the dark mode toggle
4. Wait for theme to switch
5. Take a screenshot
6. Verify:
   - Charts have appropriate dark mode colors
   - Text is readable against dark background
   - No elements appear broken or invisible
7. Toggle back to light mode
8. Verify charts return to light theme colors
```
