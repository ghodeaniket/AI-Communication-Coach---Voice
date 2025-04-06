const express = require('express');
const cors = require('cors');
const { DynamoDBClient, PutItemCommand, GetItemCommand, ScanCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

// Configuration from environment variables
const AWS_ENDPOINT = process.env.AWS_ENDPOINT || 'http://localhost:4566';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const DYNAMO_TABLE = process.env.DYNAMO_TABLE || 'voice-coach-results';
const S3_BUCKET = process.env.S3_BUCKET || 'voice-coach-storage';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({
  endpoint: AWS_ENDPOINT,
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
  }
});

const s3Client = new S3Client({
  endpoint: AWS_ENDPOINT,
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
  },
  forcePathStyle: true // Required for LocalStack
});

const app = express();
const port = 3333; // Changed port to avoid conflicts

// Parse JSON body
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://frontend-dev:5173', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key']
}));

// Logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check connection to LocalStack
    await dynamoClient.send(new ScanCommand({
      TableName: DYNAMO_TABLE,
      Limit: 1
    }));
    
    res.json({ 
      status: 'healthy',
      services: {
        dynamodb: 'connected',
        s3: 'connected'
      },
      environment: {
        aws_endpoint: AWS_ENDPOINT,
        aws_region: AWS_REGION,
        dynamo_table: DYNAMO_TABLE,
        s3_bucket: S3_BUCKET
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      environment: {
        aws_endpoint: AWS_ENDPOINT,
        aws_region: AWS_REGION,
        dynamo_table: DYNAMO_TABLE,
        s3_bucket: S3_BUCKET
      }
    });
  }
});

// Process audio endpoint (combines transcription, analytics, and feedback)
app.post('/api/process', async (req, res) => {
  console.log('Received process request');
  
  try {
    const { audio, duration = 30 } = req.body;
    
    // Save audio data to S3 if provided
    let audioKey = null;
    if (audio && audio.data) {
      // Convert base64 data to buffer
      const audioData = Buffer.from(audio.data, 'base64');
      
      // Generate unique key for S3
      audioKey = `recordings/${Date.now()}.webm`;
      
      // Upload to S3
      await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: audioKey,
        Body: audioData,
        ContentType: audio.contentType || 'audio/webm'
      }));
      
      console.log(`Uploaded audio to S3: ${S3_BUCKET}/${audioKey}`);
    }
    
    // Generate mock data
    // In a real implementation, this would call the transcription Lambda function
    const result = {
      transcription: {
        text: "This is a mock transcription for the combined process endpoint. In a real implementation, this would be the actual transcribed text from the audio recording.",
        confidence: 0.92,
        duration: duration,
      },
      analytics: {
        speakingRate: {
          wordsPerMinute: 150,
          syllablesPerMinute: 200,
          rating: "good"
        },
        fillerWords: {
          count: 5,
          words: ["um", "like", "you know"],
          percentage: 8
        },
        pauses: {
          count: 3,
          totalDuration: 2.5,
          avgDuration: 0.83
        }
      },
      feedback: {
        overall: "Your speech was clear and well-paced. This is mock feedback that would be generated based on the actual speech analysis in a production environment.",
        improvements: [
          "Try to reduce filler words like 'um' and 'like'.",
          "Consider using slightly longer pauses between main points."
        ],
        strengths: [
          "Good speaking rate",
          "Clear pronunciation"
        ],
        score: 85
      }
    };
    
    // If we uploaded audio, include the S3 reference
    if (audioKey) {
      result.audioReference = {
        bucket: S3_BUCKET,
        key: audioKey
      };
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({
      error: 'Failed to process audio',
      message: error.message
    });
  }
});

// Results API endpoints
app.post('/api/results', async (req, res) => {
  try {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    const result = {
      id,
      ...req.body,
      timestamp: req.body.timestamp || Date.now()
    };
    
    // Save to DynamoDB
    await dynamoClient.send(new PutItemCommand({
      TableName: DYNAMO_TABLE,
      Item: marshall(result)
    }));
    
    console.log(`Saved result to DynamoDB: ${id}`);
    
    res.status(201).json({
      message: 'Result saved successfully',
      id
    });
  } catch (error) {
    console.error('Error saving result:', error);
    res.status(500).json({
      error: 'Failed to save result',
      message: error.message
    });
  }
});

app.get('/api/results/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Get from DynamoDB
    const response = await dynamoClient.send(new GetItemCommand({
      TableName: DYNAMO_TABLE,
      Key: marshall({ id })
    }));
    
    if (!response.Item) {
      return res.status(404).json({
        message: 'Result not found'
      });
    }
    
    const result = unmarshall(response.Item);
    
    res.json(result);
  } catch (error) {
    console.error('Error retrieving result:', error);
    res.status(500).json({
      error: 'Failed to retrieve result',
      message: error.message
    });
  }
});

app.get('/api/results', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    
    // Scan DynamoDB
    const response = await dynamoClient.send(new ScanCommand({
      TableName: DYNAMO_TABLE
    }));
    
    if (!response.Items || response.Items.length === 0) {
      return res.json([]);
    }
    
    // Convert from DynamoDB format and create summaries
    const summaries = response.Items
      .map(item => unmarshall(item))
      .map(item => ({
        id: item.id,
        timestamp: item.timestamp,
        duration: item.audioData?.duration || item.meta?.duration || 0,
        textPreview: item.transcription?.text?.substring(0, 50) + 
          (item.transcription?.text?.length > 50 ? '...' : ''),
        overallScore: item.feedback?.score
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    res.json(summaries);
  } catch (error) {
    console.error('Error listing results:', error);
    res.status(500).json({
      error: 'Failed to list results',
      message: error.message
    });
  }
});

app.delete('/api/results/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Check if exists
    const getResponse = await dynamoClient.send(new GetItemCommand({
      TableName: DYNAMO_TABLE,
      Key: marshall({ id })
    }));
    
    if (!getResponse.Item) {
      return res.status(404).json({
        message: 'Result not found'
      });
    }
    
    // Delete from DynamoDB
    await dynamoClient.send(new DeleteItemCommand({
      TableName: DYNAMO_TABLE,
      Key: marshall({ id })
    }));
    
    console.log(`Deleted result from DynamoDB: ${id}`);
    
    res.json({
      message: 'Result deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({
      error: 'Failed to delete result',
      message: error.message
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Mock server running at http://localhost:${port}`);
});
