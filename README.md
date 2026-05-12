# Meowlin

Meowlin is a serverless AWS demo application inspired by bird identification apps. It provides a cloud-native pipeline for ingesting audio clips (meows) and processing them asynchronously.

This project is designed as a portfolio piece to demonstrate AWS serverless fundamentals including API Gateway, Lambda, S3, DynamoDB, and SQS.

## Core Stack

- **Infrastructure**: AWS SAM (Serverless Application Model)
- **API**: API Gateway (REST API)
- **Compute**: AWS Lambda (Node.js 20.x for API, Python 3.12 for Processing)
- **Storage**: S3 (Raw Audio), DynamoDB (Metadata & Results)
- **Messaging**: SQS (Asynchronous Processing)

## Quick Start

1. **Build the project**:
   ```powershell
   sam build
   ```
2. **Run locally**:
   ```powershell
   sam local start-api
   ```
3. **Test with Postman**:
   Import the collection and environment from the `postman/` directory.

# Caveats

- Although the Merlin bird ID app performs audio processing in the client on the mobile device; for this demo I have shifted this work into AWS.
- This solution relies on mock data. To truly ID cats based on their meows, it would need:
  - a robust machine learning algorithm
  - a significant collection of high quality meow data
- Authentication is intentionally omitted from the MVP to keep the demo focused on serverless ingestion and processing. A production version would use Cognito/JWT authorization to associate clips with users and protect history endpoints.

## See Also

| Document                            | Description                                                                |
| :---------------------------------- | :------------------------------------------------------------------------- |
| [ARCHITECTURE.md](ARCHITECTURE.md)  | Technical overview of the system design, sequence diagrams, and data flow. |
| [CONTRIBUTING.md](CONTRIBUTING.md)  | Guidelines for developers, coding standards, and project scope.            |
| [Postman README](postman/README.md) | Setup and usage instructions for the Postman collection and environments.  |
