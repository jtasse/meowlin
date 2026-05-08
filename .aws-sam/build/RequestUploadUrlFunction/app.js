const crypto = require("crypto")
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb")
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb")
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

const s3Client = new S3Client({})

async function insertItem(item) {
	const dynamoInsertItemCommand = new PutCommand({
		TableName: "MeowlinClips",
		Item: item,

		// Prevent accidental overwrite if UUID collision somehow occurred
		ConditionExpression: "attribute_not_exists(clipId)",
	})

	await docClient.send(dynamoInsertItemCommand)
}

exports.handler = async (event) => {
	try {
		const body = JSON.parse(event.body || "{}")

		const clientClipId = body.clientClipId

		if (!clientClipId) {
			return {
				statusCode: 400,
				body: JSON.stringify({
					error: "clientClipId is required",
				}),
			}
		}

		const clipId = crypto.randomUUID()
		const createdAt = new Date().toISOString()
		const s3Key = `uploads/${clipId}/${clientClipId}.mp3`

		const s3PutObjectCommand = new PutObjectCommand({
			Bucket: process.env.RAW_AUDIO_BUCKET_NAME,
			Key: s3Key,
			ContentType: "audio/mpeg",
		})

		const uploadUrl = await getSignedUrl(s3Client, s3PutObjectCommand, {
			expiresIn: 900,
		})

		const pendingUploadRequestItem = {
			clipId,
			clientClipId,
			clipStatus: "PENDING_UPLOAD",
			createdAt,
			s3Key,
			uploadUrl,
			uploadUrlExpiresInSeconds: 900,
		}

		await insertItem(pendingUploadRequestItem)

		return {
			statusCode: 200,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(pendingUploadRequestItem),
		}
	} catch (error) {
		console.error(error)

		return {
			statusCode: 500,
			body: JSON.stringify({
				error: "Internal server error",
			}),
		}
	}
}
