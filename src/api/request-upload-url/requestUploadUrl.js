const crypto = require("crypto")
const path = require("path")
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb")
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb")
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")
const { buildCorsHeaders } = require("../cors")

const REGION = process.env.AWS_REGION || "us-east-1"
const dynamoClient = new DynamoDBClient({
	region: REGION,
	maxAttempts: 1, // Fail fast to reduce retries, latency, and memory churn.
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const s3Client = new S3Client({})

const CLIPS_TABLE_NAME = process.env.CLIPS_TABLE_NAME
const RAW_AUDIO_BUCKET_NAME = process.env.RAW_AUDIO_BUCKET_NAME
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024)
const UPLOAD_URL_EXPIRES_IN_SECONDS = 900 // 15 minutes
const S3_KEY_PREFIX = "uploads"

/** MIME types commonly used for browser audio uploads (also allows any other audio/*). */
const ALLOWED_AUDIO_CONTENT_TYPES = new Set([
	"audio/mpeg",
	"audio/mp3",
	"audio/mp4",
	"audio/x-m4a",
	"audio/wav",
	"audio/x-wav",
	"audio/wave",
	"audio/ogg",
	"application/ogg",
	"audio/webm",
	"audio/aac",
	"audio/flac",
	"audio/x-flac",
])

function isAllowedContentType(contentType) {
	const normalized = contentType.split(";")[0].trim().toLowerCase()
	if (!normalized) return false
	if (ALLOWED_AUDIO_CONTENT_TYPES.has(normalized)) return true
	return normalized.startsWith("audio/")
}

function extensionFromFileName(fileName) {
	if (!fileName || typeof fileName !== "string") {
		return "audio"
	}
	const ext = path.extname(fileName).slice(1).toLowerCase().replace(/[^a-z0-9]/g, "")
	return ext || "audio"
}

module.exports.isAllowedContentType = isAllowedContentType
module.exports.extensionFromFileName = extensionFromFileName

exports.handler = async (event) => {
	const corsHeaders = buildCorsHeaders(event)

	console.log(
		"Request received",
		JSON.stringify({
			requestId: event?.requestContext?.requestId,
			routeKey: event?.routeKey,
			method: event?.requestContext?.http?.method,
			path: event?.rawPath,
		}),
	)

	if (!CLIPS_TABLE_NAME || !RAW_AUDIO_BUCKET_NAME) {
		console.error(
			"Missing required environment configuration",
			JSON.stringify({
				hasClipsTableName: Boolean(CLIPS_TABLE_NAME),
				hasRawAudioBucketName: Boolean(RAW_AUDIO_BUCKET_NAME),
			}),
		)
		return {
			statusCode: 500,
			headers: corsHeaders,
			body: JSON.stringify({
				message: "Server configuration error.",
			}),
		}
	}

	if (!event.body) {
		return {
			statusCode: 400,
			headers: corsHeaders,
			body: JSON.stringify({ message: "Request body is missing." }),
		}
	}

	let requestBody
	try {
		requestBody = JSON.parse(event.body)
	} catch (error) {
		return {
			statusCode: 400,
			headers: corsHeaders,
			body: JSON.stringify({ message: "Invalid JSON in request body." }),
		}
	}

	const { clientClipId, contentType, fileName, fileSize } = requestBody

	if (!clientClipId) {
		return {
			statusCode: 400,
			headers: corsHeaders,
			body: JSON.stringify({ message: "clientClipId is required." }),
		}
	}

	if (!fileName) {
		return {
			statusCode: 400,
			headers: corsHeaders,
			body: JSON.stringify({ message: "fileName is required." }),
		}
	}

	if (!contentType) {
		return {
			statusCode: 400,
			headers: corsHeaders,
			body: JSON.stringify({ message: "contentType is required." }),
		}
	}

	if (!isAllowedContentType(contentType)) {
		return {
			statusCode: 400,
			headers: corsHeaders,
			body: JSON.stringify({
				message: "contentType must be an allowed audio type.",
			}),
		}
	}

	const parsedFileSize = Number(fileSize)
	if (
		!Number.isFinite(parsedFileSize) ||
		!Number.isInteger(parsedFileSize) ||
		parsedFileSize <= 0
	) {
		return {
			statusCode: 400,
			headers: corsHeaders,
			body: JSON.stringify({
				message: "fileSize must be a positive integer (bytes).",
			}),
		}
	}

	if (parsedFileSize > MAX_UPLOAD_BYTES) {
		return {
			statusCode: 413,
			headers: corsHeaders,
			body: JSON.stringify({
				message: `File size exceeds maximum of ${MAX_UPLOAD_BYTES} bytes.`,
				maxUploadBytes: MAX_UPLOAD_BYTES,
			}),
		}
	}

	const clipId = crypto.randomUUID()
	const fileExtension = extensionFromFileName(fileName)
	const s3Key = `${S3_KEY_PREFIX}/${clipId}/${clientClipId}.${fileExtension}`
	const createdAt = new Date().toISOString()
	const clipStatus = "PENDING_UPLOAD"

	const item = {
		clipId,
		clientClipId,
		clipStatus,
		createdAt,
		s3Key,
	}

	try {
		await docClient.send(
			new PutCommand({
				TableName: CLIPS_TABLE_NAME,
				Item: item,
				ConditionExpression: "attribute_not_exists(clipId)", // Prevent accidental overwrites
			}),
		)

		const normalizedContentType = contentType.split(";")[0].trim()

		// Size is enforced in this Lambda before signing; omit ContentLength from the
		// presigned PUT so browsers are not required to match a signed body length.
		const putObjectCommand = new PutObjectCommand({
			Bucket: RAW_AUDIO_BUCKET_NAME,
			Key: s3Key,
			ContentType: normalizedContentType,
		})
		const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, {
			expiresIn: UPLOAD_URL_EXPIRES_IN_SECONDS,
		})

		return {
			statusCode: 200,
			headers: corsHeaders,
			body: JSON.stringify({
				clipId,
				clientClipId,
				clipStatus,
				s3Key,
				contentType: normalizedContentType,
				uploadUrl,
				uploadUrlExpiresInSeconds: UPLOAD_URL_EXPIRES_IN_SECONDS,
				maxUploadBytes: MAX_UPLOAD_BYTES,
			}),
		}
	} catch (error) {
		console.error(
			"Error processing request",
			JSON.stringify({
				name: error?.name,
				message: error?.message,
				requestId: event?.requestContext?.requestId,
			}),
		)
		if (error.name === "ConditionalCheckFailedException") {
			return {
				statusCode: 409, // Conflict
				headers: corsHeaders,
				body: JSON.stringify({
					message: `Clip with ID ${clipId} already exists.`,
				}),
			}
		}
		return {
			statusCode: 500,
			headers: corsHeaders,
			body: JSON.stringify({
				message: "Failed to process upload request.",
				error: error.message,
			}),
		}
	}
}
