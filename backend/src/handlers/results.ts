import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  DeleteCommand 
} from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT ? { endpoint: process.env.DYNAMODB_ENDPOINT } : {})
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'voice-coach-results';

/**
 * Save a recording result to the database
 */
export const saveResult = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    
    // Validate required fields
    if (!body.timestamp || !body.transcription) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          message: 'Missing required fields: timestamp and transcription are required'
        })
      };
    }
    
    // Generate ID if not provided
    const id = body.id || Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    
    // Prepare item for storage
    const item = {
      id,
      userId: event.requestContext.authorizer?.claims?.sub || 'anonymous',
      timestamp: body.timestamp,
      transcription: body.transcription,
      analytics: body.analytics || {},
      feedback: body.feedback || {},
      highlights: body.highlights || [],
      audioMeta: body.audioData || {},
      meta: body.meta || {}
    };
    
    // Store in DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      })
    );
    
    return {
      statusCode: 201,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        message: 'Result saved successfully',
        id
      })
    };
  } catch (error) {
    console.error('Error saving result:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      })
    };
  }
};

/**
 * Get a specific result by ID
 */
export const getResult = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    
    if (!id) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          message: 'Missing required path parameter: id'
        })
      };
    }
    
    // Get from DynamoDB
    const response = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id }
      })
    );
    
    if (!response.Item) {
      return {
        statusCode: 404,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          message: 'Result not found'
        })
      };
    }
    
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify(response.Item)
    };
  } catch (error) {
    console.error('Error getting result:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      })
    };
  }
};

/**
 * List all results, optionally limited to a specific count
 */
export const listResults = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Parse query parameters
    const limit = event.queryStringParameters?.limit 
      ? parseInt(event.queryStringParameters.limit) 
      : 10;
    
    // Query DynamoDB - In a real app, we would filter by userId
    const userId = event.requestContext.authorizer?.claims?.sub || 'anonymous';
    
    const response = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false, // Sort descending by timestamp
        Limit: limit
      })
    );
    
    // Create summaries for each result
    const summaries = (response.Items || []).map(item => ({
      id: item.id,
      timestamp: item.timestamp,
      duration: item.audioMeta?.duration || item.meta?.duration || 0,
      textPreview: item.transcription?.text?.substring(0, 50) + 
        (item.transcription?.text?.length > 50 ? '...' : ''),
      overallScore: item.feedback?.score
    }));
    
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify(summaries)
    };
  } catch (error) {
    console.error('Error listing results:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      })
    };
  }
};

/**
 * Delete a specific result by ID
 */
export const deleteResult = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const id = event.pathParameters?.id;
    
    if (!id) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(),
        body: JSON.stringify({
          message: 'Missing required path parameter: id'
        })
      };
    }
    
    // Delete from DynamoDB
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id }
      })
    );
    
    return {
      statusCode: 200,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        message: 'Result deleted successfully'
      })
    };
  } catch (error) {
    console.error('Error deleting result:', error);
    return {
      statusCode: 500,
      headers: getCorsHeaders(),
      body: JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      })
    };
  }
};

/**
 * Get CORS headers for cross-origin requests
 */
function getCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.CORS_ALLOWED_ORIGINS || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
  };
}
