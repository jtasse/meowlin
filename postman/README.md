# Postman Setup

This folder contains the Postman collection and environments for testing the Meowlin API upload flow.

## Files

- `Meowlin.postman_collection.json`: API requests for the current MVP workflow.
- `environments/meowlin-dev.postman_environment.json`: environment values for `dev`.
- `environments/meowlin-prod.postman_environment.json`: environment values for `prod`.

## Environment Variables

Set these values in each environment:

- `base_url`: API base URL without trailing slash.
  - Example: `https://4el1nculma.execute-api.us-east-1.amazonaws.com`
- `stage_name`: API stage.
  - `dev` for development
  - `prod` for production

Runtime variables populated by scripts:

- `clipId`
- `clientClipId`
- `s3Key`
- `uploadUrl`

## Request Flow

1. **Request Upload URL**
   - Method: `POST`
   - URL: `{{base_url}}/{{stage_name}}/uploads`
   - Header: `Content-Type: application/json`
   - Body example:
     ```json
     {
       "clientClipId": "0000000001"
     }
     ```

2. **Upload Audio**
   - Method: `PUT`
   - URL: `{{uploadUrl}}`
   - Header: `Content-Type: audio/mpeg`
   - Body: binary `.mp3` file from your local machine

Important: the `PUT` request intentionally bypasses API Gateway and uploads directly to S3 using the pre-signed URL.

## Post-response Script for `POST /uploads`

Place this script in **Scripts -> Post-res** for the upload URL request:

```javascript
pm.test("POST /uploads returns upload metadata", function () {
    pm.response.to.have.status(200);

    const response = pm.response.json();

    pm.expect(response.clipId).to.exist;
    pm.expect(response.clientClipId).to.exist;
    pm.expect(response.s3Key).to.exist;
    pm.expect(response.uploadUrl).to.exist;
    pm.expect(response.uploadUrlExpiresInSeconds).to.exist;

    pm.environment.set("clipId", response.clipId);
    pm.environment.set("clientClipId", response.clientClipId);
    pm.environment.set("s3Key", response.s3Key);
    pm.environment.set("uploadUrl", response.uploadUrl);
});
```

Optional script for `PUT {{uploadUrl}}`:

```javascript
pm.test("PUT pre-signed URL upload succeeds", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 204]);
});
```

## Security Notes

- Do not commit live pre-signed URLs.
- Do not store secrets in exported environment files.
- Prefer committing sanitized environment templates for public sharing.
