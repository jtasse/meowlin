# Postman Setup

This folder contains the Postman collection and environments for testing the Meowlin API upload flow. Only the files listed below should be modified by coding assistants.

> NOTE: I may make other changes via the Postman Desktop UI

## Files

- Requests (under `postman/Meowlin API`)
- Environments (under `postman/environments`)

## Environment Variables

Set these values in each environment:

- `base_url`: API base URL without trailing slash.
  - Example: `https://4fl1zulmr.execute-api.us-east-1.amazonaws.com`
- `stage_name`: API stage.

  - `dev` for development
  - `prod` for production

  > NOTE: if debugging locally, see `SAM local debugging` below. Otherwise, test using the deployed dev or prod stages (note that both will share the same base URL)

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

3. **Get Clip Result**
   - Method: `GET`
   - URL: `{{base_url}}/{{stage_name}}/clips/{{clipId}}`
   - Description: retrieve the clip processing result and status for the previously uploaded clip

Important: the `PUT` request intentionally bypasses API Gateway and uploads directly to S3 using the pre-signed URL.

## Post-response Script for `POST /uploads`

Place this script in **Scripts -> Post-res** for the upload URL request:

```javascript
pm.test("POST /uploads returns upload metadata", function () {
	pm.response.to.have.status(200)

	const response = pm.response.json()

	pm.expect(response.clipId).to.exist
	pm.expect(response.clientClipId).to.exist
	pm.expect(response.s3Key).to.exist
	pm.expect(response.uploadUrl).to.exist
	pm.expect(response.uploadUrlExpiresInSeconds).to.exist

	pm.environment.set("clipId", response.clipId)
	pm.environment.set("clientClipId", response.clientClipId)
	pm.environment.set("s3Key", response.s3Key)
	pm.environment.set("uploadUrl", response.uploadUrl)
})
```

Optional script for `PUT {{uploadUrl}}`:

```javascript
pm.test("PUT pre-signed URL upload succeeds", function () {
	pm.expect(pm.response.code).to.be.oneOf([200, 201, 204])
})
```

## Security Notes

- Do not store secrets in exported environment files.
- Exclude non-test environment files via .gitignore
