const crypto = require("crypto")

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb")

const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb")

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)

async function insertItem(item) {
	const command = new PutCommand({
		TableName: "MeowlinClips",
		Item: item,

		// Prevent accidental overwrite if UUID collision somehow occurred
		ConditionExpression: "attribute_not_exists(clipId)",
	})

	await docClient.send(command)
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

		const item = {
			clipId,
			clientClipId,
			clipStatus: "PENDING_UPLOAD",
			createdAt,
			s3Key,
		}

		await insertItem(item)

		return {
			statusCode: 200,
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(item),
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
