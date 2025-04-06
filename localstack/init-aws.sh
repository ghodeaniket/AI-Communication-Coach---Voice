#!/bin/bash
set -e

echo "Initializing AWS resources in LocalStack..."

# Configuration
AWS_REGION=us-east-1
DYNAMODB_TABLE=voice-coach-results
S3_BUCKET=voice-coach-storage
API_GATEWAY_NAME=voice-coach-api
LAMBDA_FUNCTION_NAME=voice-coach-transcription
LAMBDA_ROLE_NAME=voice-coach-lambda-role

# Create DynamoDB table
echo "Creating DynamoDB table: $DYNAMODB_TABLE"
awslocal dynamodb create-table \
  --table-name $DYNAMODB_TABLE \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

# Create S3 bucket
echo "Creating S3 bucket: $S3_BUCKET"
awslocal s3 mb s3://$S3_BUCKET

# Upload a test file to S3
echo "Uploading test file to S3..."
echo '{"message": "This is a test file"}' > /tmp/test.json
awslocal s3 cp /tmp/test.json s3://$S3_BUCKET/test.json

# Create IAM role for Lambda
echo "Creating IAM role for Lambda..."
awslocal iam create-role \
  --role-name $LAMBDA_ROLE_NAME \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }'

# Create policy for Lambda to access DynamoDB and S3
echo "Attaching policies to IAM role..."
awslocal iam attach-role-policy \
  --role-name $LAMBDA_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

awslocal iam attach-role-policy \
  --role-name $LAMBDA_ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create a simple Lambda function for transcription
echo "Creating Lambda function: $LAMBDA_FUNCTION_NAME"
cat > /tmp/function.js << 'EOF'
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  
  // Mock transcription response
  const response = {
    transcription: {
      text: "This is a mock transcription from the Lambda function.",
      confidence: 0.95,
      duration: event.duration || 30,
      wordTimings: []
    }
  };
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(response)
  };
};
EOF

# Zip the Lambda function
cd /tmp
zip function.zip function.js
cd -

# Create Lambda function
awslocal lambda create-function \
  --function-name $LAMBDA_FUNCTION_NAME \
  --runtime nodejs18.x \
  --handler function.handler \
  --role arn:aws:iam::000000000000:role/$LAMBDA_ROLE_NAME \
  --zip-file fileb:///tmp/function.zip

# Create API Gateway
echo "Creating API Gateway: $API_GATEWAY_NAME"
API_ID=$(awslocal apigateway create-rest-api \
  --name $API_GATEWAY_NAME \
  --query 'id' \
  --output text)

echo "API Gateway created with ID: $API_ID"

# Get the root resource ID
ROOT_RESOURCE_ID=$(awslocal apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[0].id' \
  --output text)

echo "Root resource ID: $ROOT_RESOURCE_ID"

# Create a resource for transcription
RESOURCE_ID=$(awslocal apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_RESOURCE_ID \
  --path-part transcribe \
  --query 'id' \
  --output text)

echo "Created resource with ID: $RESOURCE_ID"

# Create a POST method
awslocal apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method POST \
  --authorization-type NONE

# Set Lambda integration
awslocal apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method POST \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri arn:aws:apigateway:$AWS_REGION:lambda:path/2015-03-31/functions/arn:aws:lambda:$AWS_REGION:000000000000:function:$LAMBDA_FUNCTION_NAME/invocations

# Create deployment
DEPLOYMENT_ID=$(awslocal apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name dev \
  --query 'id' \
  --output text)

echo "Deployed API Gateway to stage 'dev' with deployment ID: $DEPLOYMENT_ID"

echo "AWS resources initialized successfully."
echo "API Gateway URL: http://localhost:4566/restapis/$API_ID/dev/_user_request_/transcribe"
