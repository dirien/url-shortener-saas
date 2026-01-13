import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "DELETE, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const shortCode = event.pathParameters?.shortCode;

    if (!shortCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Short code is required" }),
      };
    }

    // Check if the URL exists first
    const existingItem = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { shortCode },
      })
    );

    if (!existingItem.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Short URL not found" }),
      };
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { shortCode },
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "URL deleted successfully" }),
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
