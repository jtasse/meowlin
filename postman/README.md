# Postman Setup

This folder contains the Postman collection and environments for testing the Meowlin API upload flow. The maintained source of truth is the file-backed v3 collection under `postman/collections/Meowlin API`.

> **NOTE**: Postman can also be edited via the Desktop UI. When the local resource mapping is active, request changes should appear under `postman/collections/Meowlin API` in real time.

## Files

- Requests (under `postman/collections/Meowlin API`)
- Environments (under `postman/environments`)

## Source of Truth

- `.postman/resources.yaml` at the repository root is the Native Git mapping file Postman uses to connect local files to workspace resources.
- `postman/collections/Meowlin API` is the local file-backed collection directory currently mapped to the workspace in `.postman/resources.yaml`.

If Postman is connected to this repo as a local resource, creating a new request inside the linked collection should create a new `*.request.yaml` file under `postman/collections/Meowlin API`.

## Onboarding

Although it is possible to manually import the Postman environments and requests contained in this repo; I recommend using Postman Desktop with Native Git (via the steps below) to ensure your workspace remains synced with the repo.

1. Clone the repo locally.
2. Open Postman Desktop.
3. Open the target workspace or create a workspace for this service.
4. In `Files`, open the repo root: `C:\dev\github\meowlin` or the equivalent local clone path.
5. Click `Connect to workspace`.
6. Switch to `Local View`.

Postman should detect the local collection from `postman/collections/Meowlin API` and the environments from `postman/environments`.

If a developer cannot or does not want to use the Native Git workflow, then yes: the fallback is crude. They would need to create or pull a collection in Postman and import or recreate the requests/environments there manually.

## Environment Variables

Set these values in each environment:

- `base_url`: API base URL without trailing slash.
  - Example: `https://4fl1zuqmc.execute-api.us-east-1.amazonaws.com`
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
     	"clientClipId": "{{$timestamp}}"
     }
     ```

   > **NOTE**: the `{{$timestamp}}` dynamic Postman variable is useful because it auto-increments the value for us

2. **Upload Audio**

   - Method: `PUT`
   - URL: `{{uploadUrl}}`
   - Header: `Content-Type: audio/mpeg`
   - Body: binary `.mp3` file from your local machine
   - Current sample file: `postman/audio_samples/audio_with_meow_sample.mp3`

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
- Exclude non-test environment files via `.gitignore`
