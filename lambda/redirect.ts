import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;
const ANALYTICS_TABLE_NAME = process.env.ANALYTICS_TABLE_NAME!;

// Parse user agent to extract browser, OS, and device type
function parseUserAgent(ua: string): {
  browser: string;
  browserVersion: string;
  os: string;
  deviceType: string;
} {
  // Browser detection
  let browser = "Other";
  let browserVersion = "";

  if (ua.includes("Edg/")) {
    browser = "Edge";
    const match = ua.match(/Edg\/(\d+)/);
    browserVersion = match ? match[1] : "";
  } else if (ua.includes("Chrome/") && !ua.includes("Edg")) {
    browser = "Chrome";
    const match = ua.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : "";
  } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
    browser = "Safari";
    const match = ua.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : "";
  } else if (ua.includes("Firefox/")) {
    browser = "Firefox";
    const match = ua.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : "";
  }

  // OS detection
  let os = "Other";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS") || ua.includes("Macintosh")) os = "macOS";
  else if (ua.includes("Linux") && !ua.includes("Android")) os = "Linux";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";

  // Device type detection
  let deviceType = "Desktop";
  if (ua.includes("Mobile") || ua.includes("iPhone") || (ua.includes("Android") && !ua.includes("Tablet"))) {
    deviceType = "Mobile";
  } else if (ua.includes("Tablet") || ua.includes("iPad")) {
    deviceType = "Tablet";
  }

  return { browser, browserVersion, os, deviceType };
}

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const shortCode = event.pathParameters?.shortCode;

    if (!shortCode) {
      return {
        statusCode: 400,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Short code is required" }),
      };
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { shortCode },
      })
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Short URL not found" }),
      };
    }

    // Increment click count
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { shortCode },
        UpdateExpression: "SET clickCount = clickCount + :inc",
        ExpressionAttributeValues: {
          ":inc": 1,
        },
      })
    );

    // Extract analytics data from request headers
    const userAgent = event.headers["User-Agent"] || event.headers["user-agent"] || "";
    const referrer = event.headers["Referer"] || event.headers["referer"] || "Direct";
    const country = event.headers["CloudFront-Viewer-Country"] || event.headers["cloudfront-viewer-country"] || "Unknown";
    const region = event.headers["CloudFront-Viewer-Country-Region"] || event.headers["cloudfront-viewer-country-region"] || "";
    const city = event.headers["CloudFront-Viewer-City"] || event.headers["cloudfront-viewer-city"] || "";

    // Parse user agent
    const { browser, browserVersion, os, deviceType } = parseUserAgent(userAgent);
    const referrerDomain = referrer === "Direct" ? "Direct" : extractDomain(referrer);

    // Log analytics event asynchronously (don't block the redirect)
    docClient
      .send(
        new PutCommand({
          TableName: ANALYTICS_TABLE_NAME,
          Item: {
            shortCode,
            timestamp: new Date().toISOString(),
            userAgent,
            browser,
            browserVersion,
            os,
            deviceType,
            referrer,
            referrerDomain,
            country,
            region,
            city: city ? decodeURIComponent(city) : "",
          },
        })
      )
      .catch((err) => console.error("Analytics log failed:", err));

    return {
      statusCode: 301,
      headers: {
        ...headers,
        Location: result.Item.originalUrl,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      body: "",
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
