# E2E Test Prompts for URL Shortener

Use these prompts with the `webapp-testing` skill to test the URL shortener application.

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
