import express from 'express';
import cors from 'cors';
import { handler as healthHandler } from './handlers/health';
import { handler as transcriptionHandler } from './handlers/transcription';
import { handler as speechAnalyticsHandler } from './handlers/speechAnalytics';
import { handler as feedbackHandler } from './handlers/feedback';

// Create Express server
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for audio uploads
app.use(express.urlencoded({ extended: true }));

// Lambda handler wrapper for Express
const lambdaWrapper = (handler: any) => async (req: express.Request, res: express.Response) => {
  try {
    // Create API Gateway event from Express request
    const event = {
      httpMethod: req.method,
      path: req.path,
      queryStringParameters: req.query,
      headers: req.headers,
      body: JSON.stringify(req.body),
      isBase64Encoded: false,
    };

    // Call Lambda handler
    const result = await handler(event);

    // Set status code and headers
    res.status(result.statusCode);
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value as string);
      });
    }

    // Send response body
    res.send(result.body ? JSON.parse(result.body) : {});
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Routes
app.get('/health', lambdaWrapper(healthHandler));
app.post('/transcribe', lambdaWrapper(transcriptionHandler));
app.post('/analyze', lambdaWrapper(speechAnalyticsHandler));
app.post('/feedback', lambdaWrapper(feedbackHandler));

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log('Transcription service integrated with OpenAI Whisper');
  console.log('Environment:', process.env.NODE_ENV || 'development');
});
