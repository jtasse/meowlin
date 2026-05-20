const crypto = require("crypto")
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb")
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb")
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

const REGION = process.env.AWS_REGION || "us-east-1"
const dynamoClient = new DynamoDBClient({
	region: REGION,
	maxAttempts: 1, // Fail fast to reduce retries, latency, and memory churn.
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const s3Client = new S3Client({})

const CLIPS_TABLE_NAME = process.env.CLIPS_TABLE_NAME
const RAW_AUDIO_BUCKET_NAME = process.env.RAW_AUDIO_BUCKET_NAME
const UPLOAD_URL_EXPIRES_IN_SECONDS = 900 // 15 minutes
const S3_KEY_PREFIX = "uploads"
const CORS_HEADERS = {
	"Content-Type": "application/json",
	"Access-Control-Allow-Origin": "http://localhost:3000",
}

exports.handler = async (event) => {
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
			headers: CORS_HEADERS,
			body: JSON.stringify({
				message: "Server configuration error.",
			}),
		}
	}

	if (!event.body) {
		return {
			statusCode: 400,
			headers: CORS_HEADERS,
			body: JSON.stringify({ message: "Request body is missing." }),
		}
	}

	let requestBody
	try {
		requestBody = JSON.parse(event.body)
	} catch (error) {
		return {
			statusCode: 400,
			headers: CORS_HEADERS,
			body: JSON.stringify({ message: "Invalid JSON in request body." }),
		}
	}

	const { clientClipId } = requestBody

	if (!clientClipId) {
		return {
			statusCode: 400,
			headers: CORS_HEADERS,
			body: JSON.stringify({ message: "clientClipId is required." }),
		}
	}

	const clipId = crypto.randomUUID()
	const s3Key = `${S3_KEY_PREFIX}/${clipId}/${clientClipId}.mp3`
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

		const putObjectCommand = new PutObjectCommand({
			Bucket: RAW_AUDIO_BUCKET_NAME,
			Key: s3Key,
			ContentType: "audio/mpeg",
		})
		const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, {
			expiresIn: UPLOAD_URL_EXPIRES_IN_SECONDS,
		})

		return {
			statusCode: 200,
			headers: CORS_HEADERS,
			body: JSON.stringify({
				clipId,
				clientClipId,
				clipStatus,
				s3Key,
				uploadUrl,
				uploadUrlExpiresInSeconds: UPLOAD_URL_EXPIRES_IN_SECONDS,
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
				headers: CORS_HEADERS,
				body: JSON.stringify({
					message: `Clip with ID ${clipId} already exists.`,
				}),
			}
		}
		return {
			statusCode: 500,
			headers: CORS_HEADERS,
			body: JSON.stringify({
				message: "Failed to process upload request.",
				error: error.message,
			}),
		}
	}
}
