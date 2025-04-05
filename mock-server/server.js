const express = require('express');
const cors = require('cors');

const app = express();
const port = 3333; // Changed port to avoid conflicts

// Parse JSON body
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Api-Key']
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Process audio endpoint (combines transcription, analytics, and feedback)
app.post('/api/process', (req, res) => {
  console.log('Received process request');
  
  // In a real implementation, this would process the audio
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
});

// Mock results storage
const results = {};

// Results API endpoints
app.post('/api/results', (req, res) => {
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  const result = {
    id,
    ...req.body,
    timestamp: req.body.timestamp || Date.now()
  };
  
  results[id] = result;
  
  res.status(201).json({
    message: 'Result saved successfully',
    id
  });
});

app.get('/api/results/:id', (req, res) => {
  const id = req.params.id;
  
  if (!results[id]) {
    return res.status(404).json({
      message: 'Result not found'
    });
  }
  
  res.json(results[id]);
});

app.get('/api/results', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  
  const summaries = Object.values(results)
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
});

app.delete('/api/results/:id', (req, res) => {
  const id = req.params.id;
  
  if (!results[id]) {
    return res.status(404).json({
      message: 'Result not found'
    });
  }
  
  delete results[id];
  
  res.json({
    message: 'Result deleted successfully'
  });
});

// Start server
app.listen(port, () => {
  console.log(`Mock server running at http://localhost:${port}`);
});
