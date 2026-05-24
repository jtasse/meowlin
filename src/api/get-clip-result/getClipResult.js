const { DynamoDBClient } = require("@aws-sdk/client-dynamodb")
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb")
const { buildCorsHeaders } = require("../cors")

const REGION = process.env.AWS_REGION || "us-east-1"
const CLIPS_TABLE_NAME = process.env.CLIPS_TABLE_NAME

const dynamoClient = new DynamoDBClient({
	region: REGION,
	maxAttempts: 1,
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

exports.handler = async (event) => {
	const corsHeaders = buildCorsHeaders(event)

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
			headers: corsHeaders,
			body: JSON.stringify({ message: "Server configuration error." }),
		}
	}

	const clipId = event?.pathParameters?.clipId

	if (!clipId) {
		return {
			statusCode: 400,
			headers: corsHeaders,
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
				headers: corsHeaders,
				body: JSON.stringify({ message: "Clip not found." }),
			}
		}

		return {
			statusCode: 200,
			headers: corsHeaders,
			body: JSON.stringify(response.Item),
		}
	} catch (error) {
		console.error("Error fetching clip result", error)
		return {
			statusCode: 500,
			headers: corsHeaders,
			body: JSON.stringify({ message: "Failed to retrieve clip result. Please try again." }),
		}
	}
}
