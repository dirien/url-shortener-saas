import { APIGatewayProxyEvent } from "aws-lambda";

// Mock AWS SDK before importing handlers
const mockSend = jest.fn();
jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn(() => ({})),
}));
jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: jest.fn(() => ({
      send: mockSend,
    })),
  },
  PutCommand: jest.fn((params) => ({ type: "PutCommand", params })),
  GetCommand: jest.fn((params) => ({ type: "GetCommand", params })),
  UpdateCommand: jest.fn((params) => ({ type: "UpdateCommand", params })),
  DeleteCommand: jest.fn((params) => ({ type: "DeleteCommand", params })),
  ScanCommand: jest.fn((params) => ({ type: "ScanCommand", params })),
}));

// Set environment variables
process.env.TABLE_NAME = "test-table";

// Import handlers after mocking
import { handler as shortenHandler } from "./shorten";
import { handler as redirectHandler } from "./redirect";
import { handler as statsHandler } from "./stats";
import { handler as listHandler } from "./list";
import { handler as deleteHandler } from "./delete";

// Helper to create mock API Gateway events
function createMockEvent(
  overrides: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent {
  return {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: "GET",
    isBase64Encoded: false,
    path: "/",
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: "123456789012",
      apiId: "testapi",
      authorizer: null,
      protocol: "HTTP/1.1",
      httpMethod: "GET",
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: "127.0.0.1",
        user: null,
        userAgent: "test",
        userArn: null,
      },
      path: "/",
      stage: "test",
      requestId: "test-request-id",
      requestTimeEpoch: Date.now(),
      resourceId: "testresource",
      resourcePath: "/",
    },
    resource: "/",
    ...overrides,
  };
}

describe("Shorten Handler", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it("should return 400 if no body is provided", async () => {
    const event = createMockEvent({
      httpMethod: "POST",
      body: null,
    });

    const result = await shortenHandler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Request body is required");
  });

  it("should return 400 if URL is not provided", async () => {
    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({}),
    });

    const result = await shortenHandler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("URL is required");
  });

  it("should return 400 for invalid URL format", async () => {
    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({ url: "not-a-valid-url" }),
    });

    const result = await shortenHandler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Invalid URL format");
  });

  it("should return 400 for invalid alias format", async () => {
    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        url: "https://example.com",
        alias: "ab", // too short
      }),
    });

    const result = await shortenHandler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toContain("Invalid alias");
  });

  it("should return 409 if alias already exists", async () => {
    mockSend.mockResolvedValueOnce({ Item: { shortCode: "existing" } });

    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        url: "https://example.com",
        alias: "existing",
      }),
    });

    const result = await shortenHandler(event);

    expect(result.statusCode).toBe(409);
    expect(JSON.parse(result.body).error).toBe("Alias already exists");
  });

  it("should create a short URL successfully with custom alias", async () => {
    mockSend
      .mockResolvedValueOnce({ Item: undefined }) // GetCommand - alias doesn't exist
      .mockResolvedValueOnce({}); // PutCommand - successful

    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        url: "https://example.com/long-url",
        alias: "my-alias",
      }),
    });

    const result = await shortenHandler(event);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.shortCode).toBe("my-alias");
    expect(body.originalUrl).toBe("https://example.com/long-url");
  });

  it("should create a short URL with generated code when no alias provided", async () => {
    mockSend
      .mockResolvedValueOnce({ Item: undefined }) // GetCommand - code doesn't exist
      .mockResolvedValueOnce({}); // PutCommand - successful

    const event = createMockEvent({
      httpMethod: "POST",
      body: JSON.stringify({
        url: "https://example.com/long-url",
      }),
    });

    const result = await shortenHandler(event);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.shortCode).toBeDefined();
    expect(body.shortCode.length).toBe(6);
    expect(body.originalUrl).toBe("https://example.com/long-url");
  });

  it("should return 200 for OPTIONS request (CORS)", async () => {
    const event = createMockEvent({
      httpMethod: "OPTIONS",
    });

    const result = await shortenHandler(event);

    expect(result.statusCode).toBe(200);
    expect(result.headers?.["Access-Control-Allow-Origin"]).toBe("*");
  });
});

describe("Redirect Handler", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it("should return 404 if short code not found", async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });

    const event = createMockEvent({
      httpMethod: "GET",
      pathParameters: { shortCode: "notfound" },
    });

    const result = await redirectHandler(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).error).toBe("Short URL not found");
  });

  it("should redirect with 301 and increment click count", async () => {
    mockSend
      .mockResolvedValueOnce({
        Item: {
          shortCode: "abc123",
          originalUrl: "https://example.com/target",
          clickCount: 5,
        },
      })
      .mockResolvedValueOnce({}); // UpdateCommand for click count

    const event = createMockEvent({
      httpMethod: "GET",
      pathParameters: { shortCode: "abc123" },
    });

    const result = await redirectHandler(event);

    expect(result.statusCode).toBe(301);
    expect(result.headers?.Location).toBe("https://example.com/target");
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("should return 400 if no short code provided", async () => {
    const event = createMockEvent({
      httpMethod: "GET",
      pathParameters: null,
    });

    const result = await redirectHandler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Short code is required");
  });
});

describe("Stats Handler", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it("should return URL statistics", async () => {
    const mockItem = {
      shortCode: "abc123",
      originalUrl: "https://example.com",
      clickCount: 42,
      createdAt: "2024-01-01T00:00:00.000Z",
    };
    mockSend.mockResolvedValueOnce({ Item: mockItem });

    const event = createMockEvent({
      httpMethod: "GET",
      pathParameters: { shortCode: "abc123" },
    });

    const result = await statsHandler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.shortCode).toBe("abc123");
    expect(body.clickCount).toBe(42);
    expect(body.originalUrl).toBe("https://example.com");
    expect(body.createdAt).toBe("2024-01-01T00:00:00.000Z");
  });

  it("should return 404 if short code not found", async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });

    const event = createMockEvent({
      httpMethod: "GET",
      pathParameters: { shortCode: "notfound" },
    });

    const result = await statsHandler(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).error).toBe("Short URL not found");
  });
});

describe("List Handler", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it("should return all URLs", async () => {
    const mockItems = [
      { shortCode: "abc123", originalUrl: "https://example1.com", clickCount: 10 },
      { shortCode: "def456", originalUrl: "https://example2.com", clickCount: 20 },
    ];
    mockSend.mockResolvedValueOnce({ Items: mockItems });

    const event = createMockEvent({
      httpMethod: "GET",
    });

    const result = await listHandler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.urls).toHaveLength(2);
    expect(body.urls[0].shortCode).toBe("abc123");
    expect(body.urls[1].shortCode).toBe("def456");
  });

  it("should return empty array if no URLs exist", async () => {
    mockSend.mockResolvedValueOnce({ Items: [] });

    const event = createMockEvent({
      httpMethod: "GET",
    });

    const result = await listHandler(event);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.urls).toHaveLength(0);
  });
});

describe("Delete Handler", () => {
  beforeEach(() => {
    mockSend.mockReset();
  });

  it("should delete a URL successfully", async () => {
    mockSend
      .mockResolvedValueOnce({ Item: { shortCode: "abc123" } }) // GetCommand
      .mockResolvedValueOnce({}); // DeleteCommand

    const event = createMockEvent({
      httpMethod: "DELETE",
      pathParameters: { shortCode: "abc123" },
    });

    const result = await deleteHandler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).message).toBe("URL deleted successfully");
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("should return 404 if URL to delete not found", async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });

    const event = createMockEvent({
      httpMethod: "DELETE",
      pathParameters: { shortCode: "notfound" },
    });

    const result = await deleteHandler(event);

    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).error).toBe("Short URL not found");
  });

  it("should return 400 if no short code provided", async () => {
    const event = createMockEvent({
      httpMethod: "DELETE",
      pathParameters: null,
    });

    const result = await deleteHandler(event);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).error).toBe("Short code is required");
  });
});
