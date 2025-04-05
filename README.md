# Voice-Based AI Communication Coach

An AI-powered application that provides real-time feedback on communication skills based on voice input.

## Project Overview

This application allows users to record their speech, analyzes it using AI, and provides actionable feedback to improve communication skills.

## Key Features

- Browser-based audio recording
- Speech transcription using OpenAI Whisper API
- Analysis of speech patterns, filler words, and speaking pace
- Personalized feedback generation
- Progress tracking over time

## Technology Stack

- **Frontend**: Svelte with TypeScript
- **Backend**: AWS Lambda functions with Node.js
- **Speech Processing**: OpenAI Whisper API
- **Deployment**: AWS (API Gateway, Lambda, S3, CloudFront, DynamoDB)
- **Development**: Docker-based environment
- **CI/CD**: GitHub Actions

## Getting Started

Refer to the setup guide for detailed instructions on setting up the development environment.

## Development

```bash
# Start the development environment
docker-compose -f docker-compose.dev.yml up
```

## Testing

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

## Deployment

Refer to the deployment guide for detailed instructions on deploying the application.
