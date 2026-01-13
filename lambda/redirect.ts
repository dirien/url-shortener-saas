import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

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
