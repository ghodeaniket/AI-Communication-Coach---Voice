/**
 * Utility functions for creating standardized API responses
 */
import { APIGatewayProxyResult } from 'aws-lambda';
import { addCorsHeaders } from '../cors';

/**
 * Creates a standardized success response
 * @param data The data to include in the response
 * @param statusCode The HTTP status code (default: 200)
 * @param headers Additional headers to include
 * @returns APIGatewayProxyResult with standardized structure
 */
export const createSuccessResponse = (
  data: any,
  statusCode: number = 200,
  headers: Record<string, string> = {}
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: addCorsHeaders({
      'Content-Type': 'application/json',
      ...headers
    }),
    body: JSON.stringify({
      success: true,
      data
    })
  };
};

/**
 * Creates a standardized error response
 * @param statusCode The HTTP status code
 * @param message Error message
 * @param details Additional error details (optional)
 * @param headers Additional headers to include
 * @returns APIGatewayProxyResult with standardized structure
 */
export const createErrorResponse = (
  statusCode: number,
  message: string,
  details?: any,
  headers: Record<string, string> = {}
): APIGatewayProxyResult => {
  const responseBody: any = {
    success: false,
    error: {
      message
    }
  };
  
  if (details) {
    responseBody.error.details = details;
  }
  
  return {
    statusCode,
    headers: addCorsHeaders({
      'Content-Type': 'application/json',
      ...headers
    }),
    body: JSON.stringify(responseBody)
  };
};
