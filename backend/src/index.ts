import express from 'express';
import cors from 'cors';
import { handler as healthHandler } from './handlers/health';
import { handler as transcriptionHandler } from './handlers/transcription';
import { handler as speechAnalyticsHandler } from './handlers/speechAnalytics';
import { handler as feedbackHandler } from './handlers/feedback';
import { 
  saveResult,
  getResult,
  listResults,
  deleteResult
} from './handlers/results';

// Create express app
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON body
app.use(express.json());

// Enable CORS
const corsOptions = {
  origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key']
};
app.use(cors(corsOptions));

// Helper to convert Lambda handlers to Express middleware
const lambdaToExpress = (handler: Function) => {
  return async (req: express.Request, res: express.Response) => {
    try {
      // Convert Express request to Lambda event
      const event = {
        httpMethod: req.method,
        path: req.path,
        pathParameters: req.params,
        queryStringParameters: req.query,
        body: JSON.stringify(req.body),
        headers: req.headers,
        requestContext: {
          authorizer: {
            claims: {
              sub: 'anonymous'
            }
          }
        }
      };

      // Call Lambda handler
      const result = await handler(event);

      // Return response
      res.status(result.statusCode).set(result.headers).send(
        result.body ? JSON.parse(result.body) : {}
      );
    } catch (error) {
      console.error('Error handling request:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
};

// Define routes
app.get('/api/health', lambdaToExpress(healthHandler));
app.post('/api/transcribe', lambdaToExpress(transcriptionHandler));
app.post('/api/analyze', lambdaToExpress(speechAnalyticsHandler));
app.post('/api/feedback', lambdaToExpress(feedbackHandler));

// Process audio endpoint (combines transcription, analytics, and feedback)
app.post('/api/process', async (req, res) => {
  try {
    // In a real implementation, this would:
    // 1. Call the transcription service
    // 2. Pass the transcript to the analytics service
    // 3. Generate feedback based on analytics
    
    // For now, return mock data
    res.json({
      transcription: {
        text: "This is a mock transcription for the combined process endpoint. In a real implementation, this would be the actual transcribed text from the audio recording.",
        confidence: 0.92,
        duration: 45.5,
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
    });
  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Results API endpoints
app.post('/api/results', lambdaToExpress(saveResult));
app.get('/api/results/:id', lambdaToExpress(getResult));
app.get('/api/results', lambdaToExpress(listResults));
app.delete('/api/results/:id', lambdaToExpress(deleteResult));

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`CORS configured for: ${corsOptions.origin}`);
});
