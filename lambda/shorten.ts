import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

function generateShortCode(length: number = 6): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidAlias(alias: string): boolean {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(alias);
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Request body is required" }),
      };
    }

    const { url, alias } = JSON.parse(event.body);

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "URL is required" }),
      };
    }

    if (!isValidUrl(url)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid URL format" }),
      };
    }

    let shortCode = alias || generateShortCode();

    if (alias && !isValidAlias(alias)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error:
            "Invalid alias. Must be 3-20 characters and contain only letters, numbers, hyphens, and underscores.",
        }),
      };
    }

    // Check if alias already exists
    if (alias) {
      const existingItem = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { shortCode: alias },
        })
      );

      if (existingItem.Item) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: "Alias already exists" }),
        };
      }
    }

    // Generate unique short code if not using alias
    if (!alias) {
      let attempts = 0;
      while (attempts < 5) {
        const existingItem = await docClient.send(
          new GetCommand({
            TableName: TABLE_NAME,
            Key: { shortCode },
          })
        );
        if (!existingItem.Item) break;
        shortCode = generateShortCode();
        attempts++;
      }
    }

    const item = {
      shortCode,
      originalUrl: url,
      clickCount: 0,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    const baseUrl = process.env.BASE_URL || "";
    const shortUrl = baseUrl ? `${baseUrl}/${shortCode}` : shortCode;

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        shortCode,
        shortUrl,
        originalUrl: url,
      }),
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
