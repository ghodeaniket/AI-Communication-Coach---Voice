/**
 * AWS Service for Voice Coach application
 * 
 * This service provides simplified access to AWS services in both
 * development (LocalStack) and production environments.
 */

import { config } from '../config/environment';

class AWSService {
  private baseUrl: string;
  private region: string;
  private credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  } | null;

  constructor() {
    this.baseUrl = config.aws.endpoint || '';
    this.region = config.aws.region;
    this.credentials = config.aws.credentials || null;
  }

  /**
   * Get presigned URL for uploading audio to S3
   * In development mode, this creates a URL to LocalStack S3
   * 
   * @param key S3 object key
   * @param contentType MIME type of the file
   * @param expiresIn Expiration time in seconds
   * @returns Presigned URL for upload
   */
  public getPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600): string {
    // In development with LocalStack
    if (config.useLocalServices && this.baseUrl) {
      // For LocalStack, we'll use a simplified URL structure
      const bucket = 'voice-coach-storage';
      return `${this.baseUrl}/${bucket}/${key}`;
    }

    // In production, we would generate a proper presigned URL
    // using AWS SDK, but that would need to be done server-side
    throw new Error('Direct S3 upload in production is not supported');
  }

  /**
   * Get URL for accessing an object in S3
   * 
   * @param bucket S3 bucket name
   * @param key S3 object key
   * @returns URL to access the object
   */
  public getS3ObjectUrl(bucket: string, key: string): string {
    if (config.useLocalServices && this.baseUrl) {
      return `${this.baseUrl}/${bucket}/${key}`;
    }
    
    // In production, we would use CloudFront or S3 website URL
    return `https://${bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Call a Lambda function via HTTP
   * In development mode, this calls the LocalStack Lambda
   * 
   * @param functionName Lambda function name
   * @param payload Data to send to the function
   * @returns Promise resolving to Lambda result
   */
  public async invokeLambda(functionName: string, payload: any): Promise<any> {
    try {
      // For LocalStack, we can invoke Lambda via HTTP
      if (config.useLocalServices && this.baseUrl) {
        const response = await fetch(`${this.baseUrl}/2015-03-31/functions/${functionName}/invocations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Error invoking Lambda function: ${response.statusText}`);
        }

        return await response.json();
      }

      // In production, we would use API Gateway instead of direct Lambda invocation
      throw new Error('Direct Lambda invocation in production is not supported');
    } catch (error) {
      console.error(`Error invoking Lambda function ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Test connection to AWS services
   * @returns Promise resolving to test result
   */
  public async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to access a test file in S3
      const response = await fetch(`${this.baseUrl}/voice-coach-storage/test.json`);
      
      if (!response.ok) {
        return {
          success: false,
          message: `Failed to connect to AWS services: ${response.statusText}`
        };
      }
      
      const data = await response.json();
      
      return {
        success: true,
        message: `Successfully connected to AWS services: ${JSON.stringify(data)}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect to AWS services: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Export a singleton instance
export const awsService = new AWSService();
