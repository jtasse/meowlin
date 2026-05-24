# Meowlin

Meowlin is a serverless AWS demo that simulates identifying cat breeds from uploaded meow audio. A React frontend talks to an API built with AWS SAM, API Gateway, Lambda, S3, SQS, and DynamoDB, which mock an asynchronous pipeline for ingesting clips and returning breed results.

> **NOTE**: Audio processing is mocked today. The classifier step could be replaced with a real machine-learning pipeline later.

## Purpose

I have created this project for my portfolio in order to demonstrate AWS serverless fundamentals listed in the [Core Stack](#core-stack) below.

## Try it out

The live demo is hosted on GitHub Pages at:

**[https://jtasse.github.io/meowlin/](https://jtasse.github.io/meowlin/)**

### Steps

1. Open the link above in your browser (desktop or mobile).
2. Click **Choose audio file** and pick a short audio clip (10 MB max; common audio formats work).
3. Click **Upload** and wait for the progress bar to finish.
4. Watch the breed reveal (**Breed ID** and **Confidence** are mocked for this demo).
## Core Stack

| AWS Component                          | Description                                                             |
| :------------------------------------- | :---------------------------------------------------------------------- |
| **Serverless Application Model (SAM)** | Infrastructure management                                               |
| **API Gateway**                        | REST API                                                                |
| **Lambda**                             | Serverless functions (Node.js 22.x for API, Python 3.12 for Processing) |
| **S3**                                 | Raw audio storage (uploads expire after 7 days)                         |
| **DynamoDB**                           | Persistentence of metadata and results                                  |
| **SQS**                                | Messaging to support asynchronous processing                            |

## Inspiration

The overall solution was inspired by the [Merlin](https://merlin.allaboutbirds.org/) bird identification app, though the front end takes its cues from the [Who's That Pokémon?](https://bulbapedia.bulbagarden.net/wiki/Who%27s_That_Pok%C3%A9mon%3F#) segment of [_Pokémon the Series_](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_the_Series).

## Prerequisites

Before running the commands below, ensure you have the following installed:

- **[AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)**: Used for building and local emulation. [Install Guide]
- **[Docker Desktop](https://docs.docker.com/desktop/)**: Required by SAM to run Lambda functions in a local container environment
- **[Node.js 22.x](https://nodejs.org/en/download)**: Required to build the API Lambda functions
- **[Python 3.12](https://www.python.org/downloads/release/python-3120/)**: Required to build the processing/classifier Lambda functions
- **[AWS CLI](https://aws.amazon.com/cli/)**: Configured with credentials if you intend to deploy or interact with live AWS resources

## Quick Start

1. **Clone the repo**:
   ```powershell
   git clone https://github.com/jtasse/meowlin.git
   ```
2. **Build the project**:
   ```powershell
   sam build
   ```
3. **Run locally**:
   ```powershell
   sam local start-api
   ```
4. **Test with Postman**:
   - Import the collection and environment from the `postman/` directory.

## Frontend

The Next.js frontend lives in `src/front-end`.

To run it locally:

```powershell
cd src/front-end
npm install
npm run dev
```

Then open `http://localhost:3000`.

### GitHub Pages (static export)

The UI is built as a static export (`output: "export"` in `next.config.ts`) and deployed with [`.github/workflows/pages.yml`](.github/workflows/pages.yml) on pushes to `main`.

1. In the repo **Settings → Pages**, set **Build and deployment** source to **GitHub Actions**.
2. Add **`NEXT_PUBLIC_API_BASE_URL`** with your deployed API stage URL (for example `https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/prod` — **`/prod` is correct**). Either:
   - **Settings → Secrets and variables → Actions → Variables** (repository-wide), or
   - **Settings → Environments → github-pages → Environment variables** (only if the workflow’s `build` job uses that environment; this repo does).

   No API key is required for the public demo endpoints.
3. Redeploy the API with your Pages origin in CORS (the browser sends only scheme + host, no path):

   ```powershell
   sam deploy --parameter-overrides CorsAllowedOrigins="http://localhost:3000,https://your-user.github.io"
   ```

The site is published at `https://your-user.github.io/meowlin/` (base path matches the repository name).

## Data retention

Uploaded audio files under the `uploads/` prefix in the raw audio bucket are **automatically deleted after 7 days** via S3 lifecycle rules (see `UploadObjectExpirationDays` in `template.yaml`). Incomplete multipart uploads under that prefix are aborted after 1 day. DynamoDB clip metadata is not removed by this rule.

## Upload limits

Presigned uploads are capped at **10 MiB** by default (`MaxUploadSizeBytes` in `template.yaml`; the UI describes this as 10 MB). The API accepts common audio `Content-Type` values (and any `audio/*` type) and signs the PUT for the exact `fileSize` reported by the client.

`POST /uploads` is throttled at the API Gateway stage (10 requests/s steady, 20 burst by default) and rate-limited per IP with AWS WAF (100 requests per 5-minute window minimum). Tune via `ApiUploadThrottle*` and `WafUploadsRateLimitPerIp` in `template.yaml`.

Cross-origin access is controlled by `CorsAllowedOrigins` in `template.yaml` (defaults include local dev). When hosting the UI on GitHub Pages, see [GitHub Pages (static export)](#github-pages-static-export) and redeploy with your Pages origin included, for example:

```powershell
sam deploy --parameter-overrides CorsAllowedOrigins="http://localhost:3000,https://your-user.github.io"
```

# Caveats

- Although the Merlin bird ID app performs audio processing in the client on the mobile device; for this demo I have shifted this work into AWS.
- This solution relies on mock data. To truly ID cats based on their meows, it would need:
  - a robust machine learning algorithm
  - a significant collection of high quality meow data
- Authentication is intentionally omitted from the MVP to keep the demo focused on serverless ingestion and processing. A production version would use Cognito/JWT authorization to associate clips with users and protect history endpoints.

## High-Level Data Flow

The following diagram illustrates how data moves through the system from the initial request to the final processed result:

```mermaid
graph LR
    A[Client] -->|1. Request Upload| B(API Gateway)
    B --> C[Lambda: API]
    C -->|2. Create Metadata| D[(DynamoDB)]
    C -->|3. Return Presigned URL| A
    A -->|4. Upload audio| E{S3 Bucket}
    E -->|5. Trigger Event| F[SQS Queue]
    F --> G[Lambda: Processor]
    G -->|6. Update Result| D
```

> **NOTE**: to view a sequence digram showing the process in more detail, see [ARCHITECTURE.md](./ARCHITECTURE.md#current-sequence-diagram).

## See Also

| Document                            | Description                                                               |
| :---------------------------------- | :------------------------------------------------------------------------ |
| [ARCHITECTURE.md](ARCHITECTURE.md)  | Technical overview of the system design, sequence diagrams, and data flow |
| [CONTRIBUTING.md](CONTRIBUTING.md)  | Guidelines for developers, coding standards, and project scope            |
| [Postman README](postman/README.md) | Setup and usage instructions for the Postman collection and environments  |
