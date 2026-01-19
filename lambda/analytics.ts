import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;
const ANALYTICS_TABLE_NAME = process.env.ANALYTICS_TABLE_NAME!;

// Country code to name mapping
const countryNames: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  NL: "Netherlands",
  BE: "Belgium",
  AT: "Austria",
  CH: "Switzerland",
  CA: "Canada",
  AU: "Australia",
  JP: "Japan",
  CN: "China",
  KR: "South Korea",
  IN: "India",
  BR: "Brazil",
  MX: "Mexico",
  AR: "Argentina",
  RU: "Russia",
  PL: "Poland",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PT: "Portugal",
  IE: "Ireland",
  NZ: "New Zealand",
  SG: "Singapore",
  HK: "Hong Kong",
  Unknown: "Unknown",
};

function getCountryName(code: string): string {
  return countryNames[code] || code;
}

interface AnalyticsEvent {
  shortCode: string;
  timestamp: string;
  browser: string;
  browserVersion: string;
  os: string;
  deviceType: string;
  referrer: string;
  referrerDomain: string;
  country: string;
  region: string;
  city: string;
}

interface AggregatedData<T extends string> {
  name: T;
  clicks: number;
  percentage: number;
}

function aggregateByField<T extends string>(
  events: AnalyticsEvent[],
  field: keyof AnalyticsEvent
): AggregatedData<T>[] {
  const counts: Record<string, number> = {};
  const total = events.length;

  for (const event of events) {
    const value = (event[field] as string) || "Unknown";
    counts[value] = (counts[value] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([name, clicks]) => ({
      name: name as T,
      clicks,
      percentage: total > 0 ? Math.round((clicks / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);
}

function aggregateTimeline(
  events: AnalyticsEvent[],
  granularity: "hour" | "day" | "week"
): { date: string; clicks: number }[] {
  const counts: Record<string, number> = {};

  for (const event of events) {
    const date = new Date(event.timestamp);
    let key: string;

    if (granularity === "hour") {
      key = date.toISOString().slice(0, 13) + ":00:00.000Z";
    } else if (granularity === "day") {
      key = date.toISOString().slice(0, 10);
    } else {
      // week - use start of week (Sunday)
      const dayOfWeek = date.getDay();
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - dayOfWeek);
      key = startOfWeek.toISOString().slice(0, 10);
    }

    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const path = event.path;
    const shortCode = event.pathParameters?.shortCode;
    const queryParams = event.queryStringParameters || {};

    // Parse date range from query params
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const from = queryParams.from
      ? new Date(queryParams.from)
      : defaultFrom;
    const to = queryParams.to ? new Date(queryParams.to) : now;
    const granularity = (queryParams.granularity as "hour" | "day" | "week") || "day";
    const limit = parseInt(queryParams.limit || "10", 10);

    // Check if this is an overview request or specific URL request
    if (path.endsWith("/overview")) {
      // GET /api/analytics/overview - aggregate analytics across all URLs
      return await handleOverview(headers, from, to, granularity, limit);
    } else if (shortCode) {
      // GET /api/analytics/{shortCode} - analytics for specific URL
      return await handleSpecificUrl(headers, shortCode, from, to, granularity);
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Invalid request" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

async function handleSpecificUrl(
  headers: Record<string, string>,
  shortCode: string,
  from: Date,
  to: Date,
  granularity: "hour" | "day" | "week"
): Promise<APIGatewayProxyResult> {
  // Get URL info
  const urlResult = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { shortCode },
    })
  );

  if (!urlResult.Item) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: "URL not found" }),
    };
  }

  // Query analytics events
  const analyticsResult = await docClient.send(
    new QueryCommand({
      TableName: ANALYTICS_TABLE_NAME,
      KeyConditionExpression:
        "shortCode = :shortCode AND #ts BETWEEN :from AND :to",
      ExpressionAttributeNames: {
        "#ts": "timestamp",
      },
      ExpressionAttributeValues: {
        ":shortCode": shortCode,
        ":from": from.toISOString(),
        ":to": to.toISOString(),
      },
    })
  );

  const events = (analyticsResult.Items || []) as AnalyticsEvent[];

  // Aggregate data
  const browsers = aggregateByField<string>(events, "browser");
  const devices = aggregateByField<string>(events, "deviceType").map((d) => ({
    type: d.name,
    clicks: d.clicks,
    percentage: d.percentage,
  }));
  const countries = aggregateByField<string>(events, "country").map((c) => ({
    code: c.name,
    name: getCountryName(c.name),
    clicks: c.clicks,
    percentage: c.percentage,
  }));
  const referrers = aggregateByField<string>(events, "referrerDomain").map(
    (r) => ({
      domain: r.name,
      clicks: r.clicks,
      percentage: r.percentage,
    })
  );

  // Get top cities
  const cityCounts: Record<string, { city: string; country: string; clicks: number }> = {};
  for (const event of events) {
    if (event.city) {
      const key = `${event.city}-${event.country}`;
      if (!cityCounts[key]) {
        cityCounts[key] = { city: event.city, country: event.country, clicks: 0 };
      }
      cityCounts[key].clicks++;
    }
  }
  const topCities = Object.values(cityCounts)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  // Get unique countries count
  const uniqueCountries = new Set(events.map((e) => e.country)).size;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      shortCode,
      originalUrl: urlResult.Item.originalUrl,
      totalClicks: events.length,
      uniqueCountries,
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      timeline: aggregateTimeline(events, granularity),
      browsers,
      devices,
      countries: countries.slice(0, 10),
      referrers: referrers.slice(0, 10),
      topCities,
    }),
  };
}

async function handleOverview(
  headers: Record<string, string>,
  from: Date,
  to: Date,
  granularity: "hour" | "day" | "week",
  limit: number
): Promise<APIGatewayProxyResult> {
  // Get all URLs
  const urlsResult = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      Limit: 100,
    })
  );

  const urls = urlsResult.Items || [];

  // Collect all analytics events across all URLs
  let allEvents: AnalyticsEvent[] = [];
  const urlClickCounts: Record<string, { shortCode: string; originalUrl: string; clicks: number }> = {};

  for (const url of urls) {
    const analyticsResult = await docClient.send(
      new QueryCommand({
        TableName: ANALYTICS_TABLE_NAME,
        KeyConditionExpression:
          "shortCode = :shortCode AND #ts BETWEEN :from AND :to",
        ExpressionAttributeNames: {
          "#ts": "timestamp",
        },
        ExpressionAttributeValues: {
          ":shortCode": url.shortCode,
          ":from": from.toISOString(),
          ":to": to.toISOString(),
        },
      })
    );

    const events = (analyticsResult.Items || []) as AnalyticsEvent[];
    allEvents = allEvents.concat(events);

    if (events.length > 0) {
      urlClickCounts[url.shortCode] = {
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        clicks: events.length,
      };
    }
  }

  // Aggregate data
  const browsers = aggregateByField<string>(allEvents, "browser");
  const devices = aggregateByField<string>(allEvents, "deviceType").map((d) => ({
    type: d.name,
    clicks: d.clicks,
    percentage: d.percentage,
  }));
  const countries = aggregateByField<string>(allEvents, "country").map((c) => ({
    code: c.name,
    name: getCountryName(c.name),
    clicks: c.clicks,
    percentage: c.percentage,
  }));

  // Get top URLs
  const topUrls = Object.values(urlClickCounts)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      totalClicks: allEvents.length,
      totalUrls: urls.length,
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      timeline: aggregateTimeline(allEvents, granularity),
      topUrls,
      browsers,
      devices,
      countries: countries.slice(0, 10),
    }),
  };
}
