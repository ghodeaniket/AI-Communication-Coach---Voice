#!/bin/bash
set -e

echo "Initializing AWS resources in LocalStack..."

# Create DynamoDB table
echo "Creating DynamoDB table..."
awslocal dynamodb create-table \
  --table-name voice-coach-results \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

# Create S3 bucket
echo "Creating S3 bucket..."
awslocal s3 mb s3://voice-coach-storage

echo "AWS resources initialized successfully."
