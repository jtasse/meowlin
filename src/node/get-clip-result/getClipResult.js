const { DynamoDBClient } = require("@aws-sdk/client-dynamodb")
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb")

const REGION = process.env.AWS_REGION || "us-east-1"
const CLIPS_TABLE_NAME = process.env.CLIPS_TABLE_NAME

const dynamoClient = new DynamoDBClient({
	region: REGION,
	maxAttempts: 1,
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)
const CORS_HEADERS = {
	"Content-Type": "application/json",
	"Access-Control-Allow-Origin": "http://localhost:3000",
}

exports.handler = async (event) => {
	console.log(
		"Request received",
		JSON.stringify({
			requestId: event?.requestContext?.requestId,
			method: event?.requestContext?.http?.method,
			path: event?.rawPath,
			pathParameters: event?.pathParameters,
		}),
	)

	if (!CLIPS_TABLE_NAME) {
		console.error("Missing CLIPS_TABLE_NAME environment variable")
		return {
			statusCode: 500,
			headers: CORS_HEADERS,
			body: JSON.stringify({ message: "Server configuration error." }),
		}
	}

	const clipId = event?.pathParameters?.clipId

	if (!clipId) {
		return {
			statusCode: 400,
			headers: CORS_HEADERS,
			body: JSON.stringify({ message: "Missing clipId path parameter." }),
		}
	}

	try {
		const response = await docClient.send(
			new GetCommand({
				TableName: CLIPS_TABLE_NAME,
				Key: { clipId },
			}),
		)

		if (!response.Item) {
			return {
				statusCode: 404,
				headers: CORS_HEADERS,
				body: JSON.stringify({ message: "Clip not found." }),
			}
		}

		return {
			statusCode: 200,
			headers: CORS_HEADERS,
			body: JSON.stringify(response.Item),
		}
	} catch (error) {
		console.error("Error fetching clip result", error)
		return {
			statusCode: 500,
			headers: CORS_HEADERS,
			body: JSON.stringify({ message: "Failed to retrieve clip result." }),
		}
	}
}
