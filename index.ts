import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as path from "path";
import * as fs from "fs";

const stack = pulumi.getStack();
const projectName = "url-shortener";

// ========================================
// DynamoDB Table
// ========================================
const urlTable = new aws.dynamodb.Table("url-table", {
  name: `${projectName}-urls-${stack}`,
  billingMode: "PAY_PER_REQUEST",
  hashKey: "shortCode",
  attributes: [{ name: "shortCode", type: "S" }],
  tags: {
    Environment: stack,
    Project: projectName,
    ManagedBy: "Pulumi",
  },
});

// ========================================
// Lambda IAM Role
// ========================================
const lambdaRole = new aws.iam.Role("lambda-role", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Action: "sts:AssumeRole",
        Effect: "Allow",
        Principal: {
          Service: "lambda.amazonaws.com",
        },
      },
    ],
  }),
  tags: {
    Environment: stack,
    Project: projectName,
    ManagedBy: "Pulumi",
  },
});

new aws.iam.RolePolicyAttachment("lambda-basic", {
  role: lambdaRole.name,
  policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
});

const dynamoPolicy = new aws.iam.Policy("lambda-dynamo-policy", {
  policy: pulumi.jsonStringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
        ],
        Resource: urlTable.arn,
      },
    ],
  }),
});

new aws.iam.RolePolicyAttachment("lambda-dynamo-attachment", {
  role: lambdaRole.name,
  policyArn: dynamoPolicy.arn,
});

// ========================================
// Lambda Functions
// ========================================

const shortenFunction = new aws.lambda.Function("shorten-function", {
  name: `${projectName}-shorten-${stack}`,
  runtime: aws.lambda.Runtime.NodeJS20dX,
  handler: "shorten.handler",
  role: lambdaRole.arn,
  timeout: 30,
  memorySize: 256,
  code: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./lambda/dist"),
  }),
  environment: {
    variables: {
      TABLE_NAME: urlTable.name,
    },
  },
  tags: {
    Environment: stack,
    Project: projectName,
    ManagedBy: "Pulumi",
  },
});

const redirectFunction = new aws.lambda.Function("redirect-function", {
  name: `${projectName}-redirect-${stack}`,
  runtime: aws.lambda.Runtime.NodeJS20dX,
  handler: "redirect.handler",
  role: lambdaRole.arn,
  timeout: 30,
  memorySize: 256,
  code: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./lambda/dist"),
  }),
  environment: {
    variables: {
      TABLE_NAME: urlTable.name,
    },
  },
  tags: {
    Environment: stack,
    Project: projectName,
    ManagedBy: "Pulumi",
  },
});

const statsFunction = new aws.lambda.Function("stats-function", {
  name: `${projectName}-stats-${stack}`,
  runtime: aws.lambda.Runtime.NodeJS20dX,
  handler: "stats.handler",
  role: lambdaRole.arn,
  timeout: 30,
  memorySize: 256,
  code: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./lambda/dist"),
  }),
  environment: {
    variables: {
      TABLE_NAME: urlTable.name,
    },
  },
  tags: {
    Environment: stack,
    Project: projectName,
    ManagedBy: "Pulumi",
  },
});

const listFunction = new aws.lambda.Function("list-function", {
  name: `${projectName}-list-${stack}`,
  runtime: aws.lambda.Runtime.NodeJS20dX,
  handler: "list.handler",
  role: lambdaRole.arn,
  timeout: 30,
  memorySize: 256,
  code: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./lambda/dist"),
  }),
  environment: {
    variables: {
      TABLE_NAME: urlTable.name,
    },
  },
  tags: {
    Environment: stack,
    Project: projectName,
    ManagedBy: "Pulumi",
  },
});

const deleteFunction = new aws.lambda.Function("delete-function", {
  name: `${projectName}-delete-${stack}`,
  runtime: aws.lambda.Runtime.NodeJS20dX,
  handler: "delete.handler",
  role: lambdaRole.arn,
  timeout: 30,
  memorySize: 256,
  code: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./lambda/dist"),
  }),
  environment: {
    variables: {
      TABLE_NAME: urlTable.name,
    },
  },
  tags: {
    Environment: stack,
    Project: projectName,
    ManagedBy: "Pulumi",
  },
});

// ========================================
// API Gateway REST API
// ========================================
const api = new aws.apigateway.RestApi("url-shortener-api", {
  name: `${projectName}-api-${stack}`,
  description: "URL Shortener REST API",
  tags: {
    Environment: stack,
    Project: projectName,
    ManagedBy: "Pulumi",
  },
});

// /shorten endpoint
const shortenResource = new aws.apigateway.Resource("shorten-resource", {
  restApi: api.id,
  parentId: api.rootResourceId,
  pathPart: "shorten",
});

const shortenMethod = new aws.apigateway.Method("shorten-post", {
  restApi: api.id,
  resourceId: shortenResource.id,
  httpMethod: "POST",
  authorization: "NONE",
});

const shortenIntegration = new aws.apigateway.Integration(
  "shorten-integration",
  {
    restApi: api.id,
    resourceId: shortenResource.id,
    httpMethod: shortenMethod.httpMethod,
    integrationHttpMethod: "POST",
    type: "AWS_PROXY",
    uri: shortenFunction.invokeArn,
  }
);

const shortenOptionsMethod = new aws.apigateway.Method("shorten-options", {
  restApi: api.id,
  resourceId: shortenResource.id,
  httpMethod: "OPTIONS",
  authorization: "NONE",
});

const shortenOptionsIntegration = new aws.apigateway.Integration(
  "shorten-options-integration",
  {
    restApi: api.id,
    resourceId: shortenResource.id,
    httpMethod: shortenOptionsMethod.httpMethod,
    type: "MOCK",
    requestTemplates: {
      "application/json": '{"statusCode": 200}',
    },
  }
);

const shortenOptionsMethodResponse = new aws.apigateway.MethodResponse(
  "shorten-options-response",
  {
    restApi: api.id,
    resourceId: shortenResource.id,
    httpMethod: shortenOptionsMethod.httpMethod,
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Headers": true,
      "method.response.header.Access-Control-Allow-Methods": true,
      "method.response.header.Access-Control-Allow-Origin": true,
    },
  }
);

const shortenOptionsIntegrationResponse = new aws.apigateway.IntegrationResponse(
  "shorten-options-int-response",
  {
    restApi: api.id,
    resourceId: shortenResource.id,
    httpMethod: shortenOptionsMethod.httpMethod,
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Headers":
        "'Content-Type,Authorization'",
      "method.response.header.Access-Control-Allow-Methods": "'POST,OPTIONS'",
      "method.response.header.Access-Control-Allow-Origin": "'*'",
    },
  },
  { dependsOn: [shortenOptionsMethodResponse] }
);

// /urls endpoint (list all URLs)
const urlsResource = new aws.apigateway.Resource("urls-resource", {
  restApi: api.id,
  parentId: api.rootResourceId,
  pathPart: "urls",
});

const urlsMethod = new aws.apigateway.Method("urls-get", {
  restApi: api.id,
  resourceId: urlsResource.id,
  httpMethod: "GET",
  authorization: "NONE",
});

const urlsIntegration = new aws.apigateway.Integration("urls-integration", {
  restApi: api.id,
  resourceId: urlsResource.id,
  httpMethod: urlsMethod.httpMethod,
  integrationHttpMethod: "POST",
  type: "AWS_PROXY",
  uri: listFunction.invokeArn,
});

const urlsOptionsMethod = new aws.apigateway.Method("urls-options", {
  restApi: api.id,
  resourceId: urlsResource.id,
  httpMethod: "OPTIONS",
  authorization: "NONE",
});

const urlsOptionsIntegration = new aws.apigateway.Integration(
  "urls-options-integration",
  {
    restApi: api.id,
    resourceId: urlsResource.id,
    httpMethod: urlsOptionsMethod.httpMethod,
    type: "MOCK",
    requestTemplates: {
      "application/json": '{"statusCode": 200}',
    },
  }
);

const urlsOptionsMethodResponse = new aws.apigateway.MethodResponse(
  "urls-options-response",
  {
    restApi: api.id,
    resourceId: urlsResource.id,
    httpMethod: urlsOptionsMethod.httpMethod,
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Headers": true,
      "method.response.header.Access-Control-Allow-Methods": true,
      "method.response.header.Access-Control-Allow-Origin": true,
    },
  }
);

const urlsOptionsIntegrationResponse = new aws.apigateway.IntegrationResponse(
  "urls-options-int-response",
  {
    restApi: api.id,
    resourceId: urlsResource.id,
    httpMethod: urlsOptionsMethod.httpMethod,
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Headers":
        "'Content-Type,Authorization'",
      "method.response.header.Access-Control-Allow-Methods": "'GET,OPTIONS'",
      "method.response.header.Access-Control-Allow-Origin": "'*'",
    },
  },
  { dependsOn: [urlsOptionsMethodResponse] }
);

// /stats/{shortCode} endpoint
const statsResource = new aws.apigateway.Resource("stats-resource", {
  restApi: api.id,
  parentId: api.rootResourceId,
  pathPart: "stats",
});

const statsCodeResource = new aws.apigateway.Resource("stats-code-resource", {
  restApi: api.id,
  parentId: statsResource.id,
  pathPart: "{shortCode}",
});

const statsMethod = new aws.apigateway.Method("stats-get", {
  restApi: api.id,
  resourceId: statsCodeResource.id,
  httpMethod: "GET",
  authorization: "NONE",
});

const statsIntegration = new aws.apigateway.Integration("stats-integration", {
  restApi: api.id,
  resourceId: statsCodeResource.id,
  httpMethod: statsMethod.httpMethod,
  integrationHttpMethod: "POST",
  type: "AWS_PROXY",
  uri: statsFunction.invokeArn,
});

const statsOptionsMethod = new aws.apigateway.Method("stats-options", {
  restApi: api.id,
  resourceId: statsCodeResource.id,
  httpMethod: "OPTIONS",
  authorization: "NONE",
});

const statsOptionsIntegration = new aws.apigateway.Integration(
  "stats-options-integration",
  {
    restApi: api.id,
    resourceId: statsCodeResource.id,
    httpMethod: statsOptionsMethod.httpMethod,
    type: "MOCK",
    requestTemplates: {
      "application/json": '{"statusCode": 200}',
    },
  }
);

const statsOptionsMethodResponse = new aws.apigateway.MethodResponse(
  "stats-options-response",
  {
    restApi: api.id,
    resourceId: statsCodeResource.id,
    httpMethod: statsOptionsMethod.httpMethod,
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Headers": true,
      "method.response.header.Access-Control-Allow-Methods": true,
      "method.response.header.Access-Control-Allow-Origin": true,
    },
  }
);

const statsOptionsIntegrationResponse = new aws.apigateway.IntegrationResponse(
  "stats-options-int-response",
  {
    restApi: api.id,
    resourceId: statsCodeResource.id,
    httpMethod: statsOptionsMethod.httpMethod,
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Headers":
        "'Content-Type,Authorization'",
      "method.response.header.Access-Control-Allow-Methods": "'GET,OPTIONS'",
      "method.response.header.Access-Control-Allow-Origin": "'*'",
    },
  },
  { dependsOn: [statsOptionsMethodResponse] }
);

// /{shortCode} endpoint (redirect)
const redirectResource = new aws.apigateway.Resource("redirect-resource", {
  restApi: api.id,
  parentId: api.rootResourceId,
  pathPart: "{shortCode}",
});

const redirectMethod = new aws.apigateway.Method("redirect-get", {
  restApi: api.id,
  resourceId: redirectResource.id,
  httpMethod: "GET",
  authorization: "NONE",
});

const redirectIntegration = new aws.apigateway.Integration(
  "redirect-integration",
  {
    restApi: api.id,
    resourceId: redirectResource.id,
    httpMethod: redirectMethod.httpMethod,
    integrationHttpMethod: "POST",
    type: "AWS_PROXY",
    uri: redirectFunction.invokeArn,
  }
);

// DELETE /{shortCode} endpoint
const deleteMethod = new aws.apigateway.Method("delete-method", {
  restApi: api.id,
  resourceId: redirectResource.id,
  httpMethod: "DELETE",
  authorization: "NONE",
});

const deleteIntegration = new aws.apigateway.Integration("delete-integration", {
  restApi: api.id,
  resourceId: redirectResource.id,
  httpMethod: deleteMethod.httpMethod,
  integrationHttpMethod: "POST",
  type: "AWS_PROXY",
  uri: deleteFunction.invokeArn,
});

const redirectOptionsMethod = new aws.apigateway.Method("redirect-options", {
  restApi: api.id,
  resourceId: redirectResource.id,
  httpMethod: "OPTIONS",
  authorization: "NONE",
});

const redirectOptionsIntegration = new aws.apigateway.Integration(
  "redirect-options-integration",
  {
    restApi: api.id,
    resourceId: redirectResource.id,
    httpMethod: redirectOptionsMethod.httpMethod,
    type: "MOCK",
    requestTemplates: {
      "application/json": '{"statusCode": 200}',
    },
  }
);

const redirectOptionsMethodResponse = new aws.apigateway.MethodResponse(
  "redirect-options-response",
  {
    restApi: api.id,
    resourceId: redirectResource.id,
    httpMethod: redirectOptionsMethod.httpMethod,
    statusCode: "200",
    responseParameters: {
      "method.response.header.Access-Control-Allow-Headers": true,
      "method.response.header.Access-Control-Allow-Methods": true,
      "method.response.header.Access-Control-Allow-Origin": true,
    },
  }
);

const redirectOptionsIntegrationResponse =
  new aws.apigateway.IntegrationResponse(
    "redirect-options-int-response",
    {
      restApi: api.id,
      resourceId: redirectResource.id,
      httpMethod: redirectOptionsMethod.httpMethod,
      statusCode: "200",
      responseParameters: {
        "method.response.header.Access-Control-Allow-Headers":
          "'Content-Type,Authorization'",
        "method.response.header.Access-Control-Allow-Methods":
          "'GET,DELETE,OPTIONS'",
        "method.response.header.Access-Control-Allow-Origin": "'*'",
      },
    },
    { dependsOn: [redirectOptionsMethodResponse] }
  );

// Lambda permissions for API Gateway
const shortenPermission = new aws.lambda.Permission("shorten-permission", {
  action: "lambda:InvokeFunction",
  function: shortenFunction.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

const redirectPermission = new aws.lambda.Permission("redirect-permission", {
  action: "lambda:InvokeFunction",
  function: redirectFunction.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

const statsPermission = new aws.lambda.Permission("stats-permission", {
  action: "lambda:InvokeFunction",
  function: statsFunction.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

const listPermission = new aws.lambda.Permission("list-permission", {
  action: "lambda:InvokeFunction",
  function: listFunction.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

const deletePermission = new aws.lambda.Permission("delete-permission", {
  action: "lambda:InvokeFunction",
  function: deleteFunction.name,
  principal: "apigateway.amazonaws.com",
  sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
});

// API Gateway Deployment
const deployment = new aws.apigateway.Deployment(
  "api-deployment",
  {
    restApi: api.id,
    triggers: {
      redeployment: pulumi
        .all([
          shortenIntegration.id,
          redirectIntegration.id,
          statsIntegration.id,
          urlsIntegration.id,
          deleteIntegration.id,
          shortenOptionsIntegration.id,
          redirectOptionsIntegration.id,
          statsOptionsIntegration.id,
          urlsOptionsIntegration.id,
        ])
        .apply((ids) => JSON.stringify(ids)),
    },
  },
  {
    dependsOn: [
      shortenIntegration,
      redirectIntegration,
      statsIntegration,
      urlsIntegration,
      deleteIntegration,
      shortenOptionsIntegrationResponse,
      redirectOptionsIntegrationResponse,
      statsOptionsIntegrationResponse,
      urlsOptionsIntegrationResponse,
    ],
  }
);

const stage = new aws.apigateway.Stage("api-stage", {
  restApi: api.id,
  deployment: deployment.id,
  stageName: "api",
  tags: {
    Environment: stack,
    Project: projectName,
    ManagedBy: "Pulumi",
  },
});

// ========================================
// S3 Bucket for Frontend
// ========================================
const frontendBucket = new aws.s3.Bucket("frontend-bucket", {
  tags: {
    Environment: stack,
    Project: projectName,
    ManagedBy: "Pulumi",
  },
});

const frontendBucketOwnership = new aws.s3.BucketOwnershipControls(
  "frontend-bucket-ownership",
  {
    bucket: frontendBucket.id,
    rule: {
      objectOwnership: "BucketOwnerPreferred",
    },
  }
);

const frontendBucketPublicAccess = new aws.s3.BucketPublicAccessBlock(
  "frontend-bucket-public-access",
  {
    bucket: frontendBucket.id,
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
  }
);

const frontendBucketWebsite = new aws.s3.BucketWebsiteConfiguration(
  "frontend-bucket-website",
  {
    bucket: frontendBucket.id,
    indexDocument: {
      suffix: "index.html",
    },
    errorDocument: {
      key: "index.html",
    },
  }
);

const frontendBucketPolicy = new aws.s3.BucketPolicy(
  "frontend-bucket-policy",
  {
    bucket: frontendBucket.id,
    policy: pulumi.jsonStringify({
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicReadGetObject",
          Effect: "Allow",
          Principal: "*",
          Action: "s3:GetObject",
          Resource: pulumi.interpolate`${frontendBucket.arn}/*`,
        },
      ],
    }),
  },
  { dependsOn: [frontendBucketPublicAccess, frontendBucketOwnership] }
);

// ========================================
// CloudFront Distribution
// ========================================
const originAccessControl = new aws.cloudfront.OriginAccessControl(
  "frontend-oac",
  {
    name: `${projectName}-oac-${stack}`,
    originAccessControlOriginType: "s3",
    signingBehavior: "always",
    signingProtocol: "sigv4",
  }
);

const distribution = new aws.cloudfront.Distribution("frontend-distribution", {
  enabled: true,
  defaultRootObject: "index.html",
  priceClass: "PriceClass_100",

  origins: [
    {
      domainName: frontendBucketWebsite.websiteEndpoint,
      originId: "S3Origin",
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: "http-only",
        originSslProtocols: ["TLSv1.2"],
      },
    },
    {
      domainName: pulumi.interpolate`${api.id}.execute-api.${aws.config.region}.amazonaws.com`,
      originId: "APIGatewayOrigin",
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: "https-only",
        originSslProtocols: ["TLSv1.2"],
      },
    },
  ],

  defaultCacheBehavior: {
    targetOriginId: "S3Origin",
    viewerProtocolPolicy: "redirect-to-https",
    allowedMethods: ["GET", "HEAD", "OPTIONS"],
    cachedMethods: ["GET", "HEAD"],
    forwardedValues: {
      queryString: false,
      cookies: {
        forward: "none",
      },
    },
    minTtl: 0,
    defaultTtl: 3600,
    maxTtl: 86400,
  },

  orderedCacheBehaviors: [
    {
      pathPattern: "/api/*",
      targetOriginId: "APIGatewayOrigin",
      viewerProtocolPolicy: "https-only",
      allowedMethods: [
        "DELETE",
        "GET",
        "HEAD",
        "OPTIONS",
        "PATCH",
        "POST",
        "PUT",
      ],
      cachedMethods: ["GET", "HEAD"],
      forwardedValues: {
        queryString: true,
        headers: ["Authorization", "Content-Type"],
        cookies: {
          forward: "none",
        },
      },
      minTtl: 0,
      defaultTtl: 0,
      maxTtl: 0,
    },
  ],

  customErrorResponses: [
    {
      errorCode: 404,
      responseCode: 200,
      responsePagePath: "/index.html",
    },
    {
      errorCode: 403,
      responseCode: 200,
      responsePagePath: "/index.html",
    },
  ],

  restrictions: {
    geoRestriction: {
      restrictionType: "none",
    },
  },

  viewerCertificate: {
    cloudfrontDefaultCertificate: true,
  },

  tags: {
    Environment: stack,
    Project: projectName,
    ManagedBy: "Pulumi",
  },
});

// ========================================
// Upload Frontend Files to S3
// ========================================
const frontendDistPath = path.join(__dirname, "frontend", "dist");

function walkSync(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walkSync(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
  };
  return contentTypes[ext] || "application/octet-stream";
}

// Upload all frontend files
if (fs.existsSync(frontendDistPath)) {
  const files = walkSync(frontendDistPath);
  for (const filePath of files) {
    const relativePath = path.relative(frontendDistPath, filePath);
    const contentType = getContentType(filePath);

    new aws.s3.BucketObjectv2(
      `frontend-${relativePath.replace(/[\/\\]/g, "-")}`,
      {
        bucket: frontendBucket.id,
        key: relativePath,
        source: new pulumi.asset.FileAsset(filePath),
        contentType: contentType,
      },
      { dependsOn: [frontendBucketPolicy] }
    );
  }
}

// ========================================
// Exports
// ========================================
export const tableName = urlTable.name;
export const apiUrl = pulumi.interpolate`https://${api.id}.execute-api.${aws.config.region}.amazonaws.com/api`;
export const frontendBucketName = frontendBucket.id;
export const websiteUrl = frontendBucketWebsite.websiteEndpoint;
export const cloudfrontUrl = pulumi.interpolate`https://${distribution.domainName}`;
export const cloudfrontDomainName = distribution.domainName;
