const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
require("dotenv").config();
const REGION = "us-east-1";
const dynamodbClient = new DynamoDBClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

module.exports = dynamodbClient;
